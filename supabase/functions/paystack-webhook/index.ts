import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key not configured");
    }

    // Verify Paystack signature
    const signature = req.headers.get("x-paystack-signature");
    const body = await req.text();
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(paystackSecretKey);
    const messageData = encoder.encode(body);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData
    );
    
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== computedSignature) {
      console.error("Invalid signature");
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid signature" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const event = JSON.parse(body);
    console.log("Webhook event received:", event.event);

    // Only process successful charge events
    if (event.event !== "charge.success") {
      return new Response(
        JSON.stringify({ status: "success", message: "Event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { reference, amount, customer } = event.data;
    const amountInNaira = amount / 100; // Paystack sends in kobo

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find matching transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("paystack_reference", reference)
      .eq("status", "pending")
      .single();

    if (txError || !transaction) {
      console.log("Transaction not found or already processed");
      return new Response(
        JSON.stringify({ status: "success", message: "Transaction not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Verify amount matches
    if (transaction.amount !== amountInNaira) {
      console.error(`Amount mismatch: expected ${transaction.amount}, got ${amountInNaira}`);
      
      await supabaseAdmin
        .from("transactions")
        .update({ 
          status: "failed",
          description: `${transaction.description} - Amount mismatch`
        })
        .eq("id", transaction.id);

      return new Response(
        JSON.stringify({ status: "error", message: "Amount mismatch" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Convert Naira to diamonds
    const diamondsToAdd = Math.floor(amountInNaira / 50);

    // Get current balance
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("balance")
      .eq("user_id", transaction.user_id)
      .single();

    const currentBalance = profile?.balance || 0;
    const maxBalance = 2000;
    const newBalance = Math.min(currentBalance + diamondsToAdd, maxBalance);
    const actualDiamondsAdded = newBalance - currentBalance;

    // Update balance
    const { error: balanceError } = await supabaseAdmin
      .from("profiles")
      .update({ balance: newBalance })
      .eq("user_id", transaction.user_id);

    if (balanceError) {
      console.error("Failed to update balance:", balanceError);
      return new Response(
        JSON.stringify({ status: "error", message: "Failed to update balance" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Update transaction status
    await supabaseAdmin
      .from("transactions")
      .update({ 
        status: "completed",
        amount: actualDiamondsAdded,
        description: `Deposit verified - ₦${amountInNaira} (${actualDiamondsAdded}💎)`
      })
      .eq("id", transaction.id);

    console.log(`Payment processed: ${actualDiamondsAdded} diamonds added to user ${transaction.user_id}`);

    return new Response(
      JSON.stringify({ status: "success", message: "Payment processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
