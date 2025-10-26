import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { amount, bankName, accountNumber, accountName } = await req.json();

    // Validation
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }
    if (!bankName || !accountNumber || !accountName) {
      throw new Error("Missing required bank details");
    }
    if (accountNumber.length < 10) {
      throw new Error("Invalid account number");
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user profile and check balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      throw new Error("Failed to fetch user profile");
    }

    if (!profile || profile.balance < amount) {
      throw new Error("Insufficient balance");
    }

    // Check for pending withdrawals
    const { data: pendingWithdrawal } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "withdrawal")
      .eq("status", "pending")
      .limit(1);

    if (pendingWithdrawal && pendingWithdrawal.length > 0) {
      throw new Error("You already have a pending withdrawal");
    }

    // Create withdrawal transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "withdrawal",
        amount: amount,
        status: "pending",
        description: `Withdrawal to ${bankName} - ${accountNumber} (${accountName})`
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error("Failed to create withdrawal request");
    }

    // Deduct balance
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ balance: profile.balance - amount })
      .eq("user_id", user.id);

    if (updateError) {
      // Rollback transaction
      await supabaseAdmin
        .from("transactions")
        .delete()
        .eq("id", transaction.id);
      throw new Error("Failed to update balance");
    }

    console.log(`Withdrawal created for user ${user.id}: ${amount} diamonds to ${bankName}`);

    return new Response(
      JSON.stringify({ 
        status: "success", 
        message: "Withdrawal request submitted successfully",
        transactionId: transaction.id,
        newBalance: profile.balance - amount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Withdrawal error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
