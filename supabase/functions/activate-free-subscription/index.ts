import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user from the auth token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan_name, billing_cycle, redeem_code_id } = await req.json();

    // Validate inputs
    if (!plan_name || !billing_cycle || !redeem_code_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: plan_name, billing_cycle, redeem_code_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['pro', 'ultra'].includes(plan_name)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan_name. Must be "pro" or "ultra"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['monthly', 'yearly'].includes(billing_cycle)) {
      return new Response(
        JSON.stringify({ error: 'Invalid billing_cycle. Must be "monthly" or "yearly"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Activating free subscription for user ${user.id}: ${plan_name} ${billing_cycle}`);

    // Calculate subscription period
    const now = new Date();
    const periodEnd = new Date(now);
    if (billing_cycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Create subscription record
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_name: plan_name,
        billing_cycle: billing_cycle,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        razorpay_subscription_id: `free_${Date.now()}`, // Mark as free subscription
      })
      .select()
      .single();

    if (subError) {
      console.error('Failed to create subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a payment record for tracking (amount 0)
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        razorpay_order_id: `free_order_${Date.now()}`,
        razorpay_payment_id: `free_payment_${Date.now()}`,
        amount: 0,
        currency: 'INR',
        status: 'captured',
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      // Continue anyway, subscription is already created
    }

    // Record the code usage using the RPC function
    const { error: redeemError } = await supabaseAdmin.rpc('apply_redeem_code', {
      p_code_id: redeem_code_id,
      p_payment_id: payment?.id || null,
    });

    if (redeemError) {
      console.error('Failed to record code usage:', redeemError);
      // Continue anyway, subscription is already active
    }

    // Update user's profile with subscription tier
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        subscription_tier: plan_name,
        subscription_expires_at: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Free subscription activated successfully for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        plan_name: plan_name,
        billing_cycle: billing_cycle,
        expires_at: periodEnd.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in activate-free-subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to activate subscription' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
