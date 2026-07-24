import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Diamonds -> Naira (1 diamond = ₦50)
const DIAMOND_TO_NAIRA = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ status: "error", message: "No authorization header" }, 401);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) return json({ status: "error", message: "Unauthorized" }, 401);

    const { amount, bankName, accountNumber, accountName } = await req.json();

    const diamonds = Number(amount);
    if (!diamonds || diamonds <= 0) return json({ status: "error", message: "Invalid amount" }, 400);
    if (!bankName || !accountNumber || !accountName) {
      return json({ status: "error", message: "Missing required bank details" }, 400);
    }
    if (!/^\d{10}$/.test(String(accountNumber))) {
      return json({ status: "error", message: "Account number must be 10 digits" }, 400);
    }

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) return json({ status: "error", message: "Paystack not configured" }, 500);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (profileError || !profile) return json({ status: "error", message: "Failed to fetch profile" }, 400);
    if (profile.balance < diamonds) return json({ status: "error", message: "Insufficient balance" }, 400);

    // Block if pending withdrawal exists
    const { data: pending } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "withdrawal")
      .eq("status", "pending")
      .limit(1);
    if (pending && pending.length > 0) {
      return json({ status: "error", message: "You already have a pending withdrawal" }, 400);
    }

    const naira = diamonds * DIAMOND_TO_NAIRA;

    // 1) Resolve Paystack bank code from bank name
    const banksRes = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=200", {
      headers: { Authorization: `Bearer ${paystackKey}` },
    });
    const banksJson = await banksRes.json();
    if (!banksRes.ok || !banksJson.status) {
      console.error("Paystack banks error", banksJson);
      return json({ status: "error", message: "Failed to fetch bank list" }, 502);
    }
    const target = String(bankName).trim().toLowerCase();
    const bank = banksJson.data.find((b: any) => String(b.name).toLowerCase() === target)
      || banksJson.data.find((b: any) => String(b.name).toLowerCase().includes(target))
      || banksJson.data.find((b: any) => target.includes(String(b.name).toLowerCase()));
    if (!bank?.code) return json({ status: "error", message: `Unsupported bank: ${bankName}` }, 400);

    // 2) Verify account
    const resolveRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bank.code}`,
      { headers: { Authorization: `Bearer ${paystackKey}` } }
    );
    const resolveJson = await resolveRes.json();
    if (!resolveRes.ok || !resolveJson.status) {
      return json({ status: "error", message: resolveJson.message || "Account verification failed" }, 400);
    }
    const verifiedName = resolveJson.data.account_name as string;

    // 3) Create transfer recipient
    const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: { Authorization: `Bearer ${paystackKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bank.code,
        currency: "NGN",
      }),
    });
    const recipientJson = await recipientRes.json();
    if (!recipientRes.ok || !recipientJson.status) {
      return json({ status: "error", message: recipientJson.message || "Failed to create recipient" }, 502);
    }
    const recipientCode = recipientJson.data.recipient_code;

    // 4) Create pending transaction FIRST and deduct balance atomically-ish
    const { data: transaction, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "withdrawal",
        amount: diamonds,
        status: "pending",
        description: `Withdrawal ₦${naira.toLocaleString()} to ${bank.name} - ${accountNumber} (${verifiedName})`,
      })
      .select()
      .single();
    if (txErr || !transaction) return json({ status: "error", message: "Failed to create transaction" }, 500);

    const newBalance = profile.balance - diamonds;
    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ balance: newBalance })
      .eq("user_id", user.id);
    if (updErr) {
      await supabaseAdmin.from("transactions").delete().eq("id", transaction.id);
      return json({ status: "error", message: "Failed to update balance" }, 500);
    }

    // 5) Initiate Paystack transfer
    const transferRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: { Authorization: `Bearer ${paystackKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "balance",
        amount: naira * 100, // kobo
        recipient: recipientCode,
        reason: `Quiz2cash withdrawal for ${verifiedName}`,
        reference: `wd_${transaction.id}`,
      }),
    });
    const transferJson = await transferRes.json();

    if (!transferRes.ok || !transferJson.status) {
      // Refund on failure
      await supabaseAdmin.from("profiles").update({ balance: profile.balance }).eq("user_id", user.id);
      await supabaseAdmin.from("transactions")
        .update({ status: "failed", description: `${transaction.description} — ${transferJson.message || 'transfer failed'}` })
        .eq("id", transaction.id);
      return json({
        status: "error",
        message: transferJson.message || "Transfer failed",
      }, 502);
    }

    const status = transferJson.data.status; // 'success' | 'pending' | 'otp' | 'reversed' etc.
    const finalStatus = status === "success" ? "completed" : "pending";
    await supabaseAdmin.from("transactions")
      .update({ status: finalStatus })
      .eq("id", transaction.id);

    return json({
      status: "success",
      message: status === "success"
        ? "Withdrawal completed"
        : "Withdrawal is being processed by Paystack",
      transactionId: transaction.id,
      newBalance,
      paystackStatus: status,
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return json({ status: "error", message: (error as Error).message }, 500);
  }
});
