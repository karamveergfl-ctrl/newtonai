import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pricing in paise (1 INR = 100 paise)
const PRICING = {
  pro: {
    monthly: 69900,    // Rs 699
    yearly: 649900,    // Rs 6,499
  },
  ultra: {
    monthly: 129900,   // Rs 1,299
    yearly: 1199900,   // Rs 11,999
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan_name, billing_cycle, discount_percent, redeem_code_id } = await req.json();

    // Validate inputs
    if (!plan_name || !billing_cycle) {
      return new Response(
        JSON.stringify({ error: 'Missing plan_name or billing_cycle' }),
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

    let amount = PRICING[plan_name as keyof typeof PRICING][billing_cycle as 'monthly' | 'yearly'];
    
    // Apply discount if provided (validate discount percent is between 0-100)
    const validDiscount = typeof discount_percent === 'number' && discount_percent >= 0 && discount_percent <= 100 
      ? discount_percent 
      : 0;
    
    if (validDiscount > 0) {
      const discountAmount = Math.round((amount * validDiscount) / 100);
      amount = amount - discountAmount;
      console.log(`Applying ${validDiscount}% discount: ${discountAmount} paise off, new amount: ${amount}`);
    }

    console.log(`Creating order for user ${user.id}: ${plan_name} ${billing_cycle} - ${amount} paise`);

    // Create Razorpay order
    const orderData = {
      amount: amount,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_name: plan_name,
        billing_cycle: billing_cycle,
        discount_percent: validDiscount.toString(),
        redeem_code_id: redeem_code_id || '',
      },
    };

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay order creation failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create order. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = await razorpayResponse.json();
    console.log('Razorpay order created:', order.id);

    // Store payment record in database
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: amount,
        currency: 'INR',
        status: 'created',
      });

    if (insertError) {
      console.error('Failed to store payment record:', insertError);
      // Don't fail the request, payment can still proceed
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: amount,
        currency: 'INR',
        key_id: razorpayKeyId,
        plan_name: plan_name,
        billing_cycle: billing_cycle,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in razorpay-create-order:', error);
    return new Response(
      JSON.stringify({ error: 'Order creation failed. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
