import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const nairaToDiamonds = (n: number) => Math.floor(n / 50);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "Missing reference" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackKey}` },
    });
    const data = await res.json();
    if (!res.ok || !data.status) {
      return new Response(JSON.stringify({ error: data.message || "Verify failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tx = data.data;
    if (tx.status !== "success") {
      return new Response(JSON.stringify({ credited: false, status: tx.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tx.metadata?.user_id && tx.metadata.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "User mismatch" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotency
    const { data: existing } = await admin
      .from("transactions")
      .select("id")
      .eq("paystack_reference", reference)
      .maybeSingle();
    if (existing) {
      const { data: profile } = await admin
        .from("profiles").select("balance").eq("user_id", user.id).single();
      return new Response(JSON.stringify({ credited: true, already: true, newBalance: profile?.balance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const naira = tx.amount / 100;
    const diamonds = nairaToDiamonds(naira);

    const { data: profile, error: pErr } = await admin
      .from("profiles").select("balance").eq("user_id", user.id).single();
    if (pErr) throw pErr;

    const newBalance = (profile?.balance || 0) + diamonds;
    const { error: upErr } = await admin
      .from("profiles").update({ balance: newBalance }).eq("user_id", user.id);
    if (upErr) throw upErr;

    await admin.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount: diamonds,
      status: "completed",
      description: `Paystack deposit - ₦${naira.toLocaleString()} (${diamonds}💎)`,
      paystack_reference: reference,
    });

    return new Response(JSON.stringify({ credited: true, diamonds, newBalance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("paystack-verify error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
