import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { amount, origin } = await req.json();
    const naira = Number(amount);
    if (!naira || naira < 100) {
      return jsonResponse({ error: "Minimum amount is ₦100" }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const user = userData.user;

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) {
      return jsonResponse({ error: "Paystack not configured" }, 500);
    }

    const baseUrl = origin || req.headers.get("origin") || "";
    const callback_url = `${baseUrl}/wallet/deposit`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(naira * 100), // kobo
        currency: "NGN",
        callback_url,
        metadata: { user_id: user.id, naira },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.status) {
      console.error("Paystack init error", data);
      return jsonResponse({
        error: data.message || "Paystack error",
        code: data.code,
        type: data.type,
        nextStep: data.meta?.nextStep,
      }, res.status >= 400 && res.status < 600 ? res.status : 502);
    }

    return jsonResponse({
      url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (e) {
    console.error("paystack-initialize error", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
