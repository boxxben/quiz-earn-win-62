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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      throw new Error("Admin access required");
    }

    const { transactionId, action } = await req.json();

    if (!transactionId || !action || !["approve", "reject"].includes(action)) {
      throw new Error("Invalid request parameters");
    }

    // Get transaction details
    const { data: transaction, error: txFetchError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("status", "pending")
      .single();

    if (txFetchError || !transaction) {
      throw new Error("Transaction not found or already processed");
    }

    const newStatus = action === "approve" ? "completed" : "failed";

    // Update transaction status
    const { error: txUpdateError } = await supabaseAdmin
      .from("transactions")
      .update({ status: newStatus })
      .eq("id", transactionId)
      .eq("status", "pending");

    if (txUpdateError) {
      throw new Error("Failed to update transaction");
    }

    // If approving a deposit, credit user's balance
    if (action === "approve" && transaction.type === "deposit") {
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("balance")
        .eq("user_id", transaction.user_id)
        .single();

      if (profileError || !userProfile) {
        throw new Error("User profile not found");
      }

      // Convert Naira to diamonds (50 Naira = 1 diamond)
      const diamondsToAdd = Math.floor(transaction.amount / 50);
      const maxBalance = 2000;
      const newBalance = Math.min(userProfile.balance + diamondsToAdd, maxBalance);

      const { error: balanceError } = await supabaseAdmin
        .from("profiles")
        .update({ balance: newBalance })
        .eq("user_id", transaction.user_id);

      if (balanceError) {
        console.error("Failed to update balance:", balanceError);
        // Rollback transaction status
        await supabaseAdmin
          .from("transactions")
          .update({ status: "pending" })
          .eq("id", transactionId);
        throw new Error("Failed to update user balance");
      }

      console.log(`Deposit approved: ${diamondsToAdd} diamonds added to user ${transaction.user_id}`);
    }

    // Note: Withdrawals already deducted balance when created, so no balance change needed on approval

    console.log(`Transaction ${transactionId} ${action}d by admin ${user.id}`);

    return new Response(
      JSON.stringify({ 
        status: "success", 
        message: `Payment ${action}d successfully`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Admin approval error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
