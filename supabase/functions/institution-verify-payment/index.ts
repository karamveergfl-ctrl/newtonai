import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, institution_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !institution_id) {
      throw new Error("Missing required fields");
    }

    // Verify admin
    const { data: isAdmin } = await supabase.rpc("is_institution_admin", {
      _institution_id: institution_id,
      _user_id: user.id,
    });
    if (!isAdmin) throw new Error("Not institution admin");

    // Verify signature using HMAC SHA256
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body)
    );
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    // Update payment record
    await supabase
      .from("institution_payments")
      .update({
        razorpay_payment_id,
        status: "captured",
      })
      .eq("razorpay_order_id", razorpay_order_id);

    // Activate subscription
    const now = new Date();
    const periodEnd = new Date(now);
    
    // Get billing cycle from subscription
    const { data: sub } = await supabase
      .from("institution_subscriptions")
      .select("billing_cycle, id")
      .eq("institution_id", institution_id)
      .single();

    if (sub?.billing_cycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await supabase
      .from("institution_subscriptions")
      .update({
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq("institution_id", institution_id);

    // Update payment billing period
    await supabase
      .from("institution_payments")
      .update({
        billing_period_start: now.toISOString(),
        billing_period_end: periodEnd.toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id);

    // Audit log
    await supabase.rpc("log_institution_audit", {
      p_institution_id: institution_id,
      p_user_id: user.id,
      p_action: "subscription_payment",
      p_entity_type: "subscription",
      p_entity_id: sub?.id || null,
      p_details: { razorpay_payment_id, plan_tier: sub?.billing_cycle },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
