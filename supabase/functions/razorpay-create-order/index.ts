import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'PLN' | 'AUD' | 'CAD' | 'SGD';

// Pricing in smallest currency units (paise for INR, cents for USD, etc.)
const PRICING: Record<string, Record<string, Record<CurrencyCode, number>>> = {
  pro: {
    monthly: {
      INR: 69900,    // ₹699
      USD: 849,      // $8.49
      EUR: 799,      // €7.99
      GBP: 699,      // £6.99
      PLN: 3500,     // zł35
      AUD: 1299,     // A$12.99
      CAD: 1149,     // C$11.49
      SGD: 1149,     // S$11.49
    },
    yearly: {
      INR: 649900,   // ₹6,499
      USD: 7800,     // $78
      EUR: 7400,     // €74
      GBP: 6400,     // £64
      PLN: 32000,    // zł320
      AUD: 11900,    // A$119
      CAD: 10500,    // C$105
      SGD: 10500,    // S$105
    },
  },
  ultra: {
    monthly: {
      INR: 129900,   // ₹1,299
      USD: 1599,     // $15.99
      EUR: 1499,     // €14.99
      GBP: 1299,     // £12.99
      PLN: 6500,     // zł65
      AUD: 2399,     // A$23.99
      CAD: 2149,     // C$21.49
      SGD: 2149,     // S$21.49
    },
    yearly: {
      INR: 1199900,  // ₹11,999
      USD: 14500,    // $145
      EUR: 13500,    // €135
      GBP: 11800,    // £118
      PLN: 59000,    // zł590
      AUD: 21900,    // A$219
      CAD: 19500,    // C$195
      SGD: 19500,    // S$195
    },
  },
};

const SUPPORTED_CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'PLN', 'AUD', 'CAD', 'SGD'];

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

    const { plan_name, billing_cycle, discount_percent, redeem_code_id, currency } = await req.json();

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

    // Validate and default currency
    const selectedCurrency: CurrencyCode = SUPPORTED_CURRENCIES.includes(currency) ? currency : 'INR';

    // Get base amount from server-side pricing (ignores any client-provided amount)
    let amount = PRICING[plan_name][billing_cycle][selectedCurrency];
    
    // Apply discount if provided (validate discount percent is between 0-100)
    const validDiscount = typeof discount_percent === 'number' && discount_percent >= 0 && discount_percent <= 100 
      ? discount_percent 
      : 0;
    
    if (validDiscount > 0) {
      const discountAmount = Math.round((amount * validDiscount) / 100);
      amount = amount - discountAmount;
      console.log(`Applying ${validDiscount}% discount: ${discountAmount} off, new amount: ${amount} ${selectedCurrency}`);
    }

    console.log(`Creating order for user ${user.id}: ${plan_name} ${billing_cycle} - ${amount} ${selectedCurrency}`);

    // Create Razorpay order
    const orderData = {
      amount: amount,
      currency: selectedCurrency,
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
        currency: selectedCurrency,
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
        currency: selectedCurrency,
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
