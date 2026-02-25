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

    const { institution_id, student_seats, teacher_seats, plan_tier, billing_cycle } = await req.json();

    if (!institution_id || !plan_tier) throw new Error("Missing required fields");

    // Verify admin
    const { data: isAdmin } = await supabase.rpc("is_institution_admin", {
      _institution_id: institution_id,
      _user_id: user.id,
    });
    if (!isAdmin) throw new Error("Not institution admin");

    // Calculate price
    const tierPricing: Record<string, { student: number; teacher: number }> = {
      starter: { student: 4900, teacher: 49900 },
      growth: { student: 9900, teacher: 99900 },
      enterprise: { student: 14900, teacher: 149900 },
    };

    const pricing = tierPricing[plan_tier] || tierPricing.starter;
    let totalAmount = (student_seats || 50) * pricing.student + (teacher_seats || 5) * pricing.teacher;

    // Yearly discount
    if (billing_cycle === "yearly") {
      totalAmount = Math.round(totalAmount * 12 * 0.8); // 20% off annual
    }

    // Create Razorpay order
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    const rpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${razorpayKeyId}:${razorpaySecret}`),
      },
      body: JSON.stringify({
        amount: totalAmount,
        currency: "INR",
        receipt: `inst_${institution_id.substring(0, 8)}_${Date.now()}`,
      }),
    });

    if (!rpResponse.ok) {
      const rpError = await rpResponse.text();
      throw new Error(`Razorpay error: ${rpError}`);
    }

    const order = await rpResponse.json();

    // Upsert subscription
    const { data: sub } = await supabase
      .from("institution_subscriptions")
      .upsert({
        institution_id,
        plan_tier,
        student_seats: student_seats || 50,
        teacher_seats: teacher_seats || 5,
        price_per_student: pricing.student / 100,
        price_per_teacher: pricing.teacher / 100,
        billing_cycle: billing_cycle || "monthly",
        status: "pending",
      }, { onConflict: "institution_id" })
      .select("id")
      .single();

    // Insert pending payment
    await supabase.from("institution_payments").insert({
      institution_id,
      subscription_id: sub!.id,
      amount: totalAmount,
      currency: "INR",
      razorpay_order_id: order.id,
      status: "created",
    });

    return new Response(
      JSON.stringify({ order_id: order.id, amount: totalAmount, key_id: razorpayKeyId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
