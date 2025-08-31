import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { reference, userId, amount } = await req.json();

    if (!reference || !userId || !amount) {
      throw new Error("Missing required fields: reference, userId, amount");
    }

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key not configured");
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
    });

    const verifyData = await verifyResponse.json();
    console.log("Paystack verification response:", verifyData);

    if (!verifyData.status || verifyData.data.status !== "success") {
      throw new Error("Payment verification failed");
    }

    // Verify the amount matches (Paystack returns amount in kobo, so divide by 100)
    const paystackAmount = verifyData.data.amount / 100;
    if (paystackAmount !== amount) {
      throw new Error(`Amount mismatch: expected ${amount}, got ${paystackAmount}`);
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if this transaction already exists
    const { data: existingTransaction } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("paystack_reference", reference)
      .single();

    if (existingTransaction) {
      return new Response(
        JSON.stringify({ status: "success", message: "Transaction already processed", amountAdded: amount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Convert Naira to diamonds (1 Naira = 0.02 diamonds, or 50 Naira = 1 diamond)
    const diamondsToAdd = Math.floor(amount / 50);

    // Get current user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      throw new Error(`Failed to get user profile: ${profileError.message}`);
    }

    const currentBalance = profile?.balance || 0;
    const newBalance = currentBalance + diamondsToAdd;

    // Enforce wallet limit (2000 diamonds max)
    const maxBalance = 2000;
    const finalBalance = Math.min(newBalance, maxBalance);
    const actualDiamondsAdded = finalBalance - currentBalance;

    // Update user balance
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        user_id: userId,
        balance: finalBalance,
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      throw new Error(`Failed to update balance: ${updateError.message}`);
    }

    // Record transaction
    const { error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: userId,
        type: "deposit",
        amount: actualDiamondsAdded,
        status: "completed",
        description: `Wallet deposit via Paystack - ₦${amount}`,
        paystack_reference: reference,
      });

    if (transactionError) {
      console.error("Failed to record transaction:", transactionError);
      // Don't throw here since the balance was already updated
    }

    console.log(`Payment verified successfully for user ${userId}: ₦${amount} (${actualDiamondsAdded} diamonds)`);

    return new Response(
      JSON.stringify({ 
        status: "success", 
        amountAdded: amount,
        diamondsAdded: actualDiamondsAdded,
        newBalance: finalBalance
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});