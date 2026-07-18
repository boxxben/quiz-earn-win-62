import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1 diamond = 50 naira
const nairaToDiamonds = (n: number) => Math.floor(n / 50);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const stripe = new Stripe(Deno.env.get("STRIPE_LIVE_API_KEY")!, {
      apiVersion: "2024-06-20",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ status: session.payment_status, credited: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.metadata?.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Session/user mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for DB writes
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotency: check if we already credited this session
    const { data: existing } = await admin
      .from("transactions")
      .select("id")
      .eq("paystack_reference", session.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ credited: true, already: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const naira = Number(session.metadata?.naira || 0);
    const diamonds = nairaToDiamonds(naira);

    // Fetch current balance
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (pErr) throw pErr;

    const newBalance = (profile?.balance || 0) + diamonds;

    const { error: upErr } = await admin
      .from("profiles")
      .update({ balance: newBalance })
      .eq("user_id", user.id);
    if (upErr) throw upErr;

    await admin.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount: diamonds,
      status: "completed",
      description: `Stripe deposit - ₦${naira.toLocaleString()} (${diamonds}💎)`,
      paystack_reference: session.id,
    });

    return new Response(
      JSON.stringify({ credited: true, diamonds, newBalance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("stripe-verify-payment error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
