import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

// HMAC SHA256 implementation using Web Crypto API
async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook signature from headers
    const webhookSignature = req.headers.get('x-razorpay-signature');
    const body = await req.text();

    if (!webhookSignature) {
      console.error('No webhook signature provided');
      return new Response(
        JSON.stringify({ error: 'No webhook signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    const expectedSignature = await hmacSha256(razorpayKeySecret, body);
    
    if (expectedSignature !== webhookSignature) {
      console.error('Webhook signature verification failed');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const webhookId = payload.id;

    // Replay attack prevention: Check if webhook already processed
    if (webhookId) {
      const { data: existingWebhook } = await supabaseAdmin
        .from('webhook_events')
        .select('id')
        .eq('id', webhookId)
        .single();

      if (existingWebhook) {
        console.log(`Duplicate webhook detected: ${webhookId}`);
        return new Response(
          JSON.stringify({ received: true, duplicate: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store webhook ID before processing to prevent race conditions
      const { error: insertError } = await supabaseAdmin
        .from('webhook_events')
        .insert({
          id: webhookId,
          event_type: event,
          payload: payload
        });

      if (insertError) {
        // If insert fails due to duplicate, another request is processing
        console.log(`Concurrent webhook processing detected: ${webhookId}`);
        return new Response(
          JSON.stringify({ received: true, duplicate: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Received webhook event: ${event}`);

    switch (event) {
      case 'payment.captured': {
        const payment = payload.payload.payment.entity;
        console.log(`Payment captured: ${payment.id}, order: ${payment.order_id}`);
        
        // Update payment status
        await supabaseAdmin
          .from('payments')
          .update({ status: 'paid' })
          .eq('razorpay_order_id', payment.order_id);
        
        break;
      }

      case 'payment.failed': {
        const payment = payload.payload.payment.entity;
        console.log(`Payment failed: ${payment.id}, order: ${payment.order_id}`);
        
        // Update payment status
        await supabaseAdmin
          .from('payments')
          .update({ status: 'failed' })
          .eq('razorpay_order_id', payment.order_id);
        
        break;
      }

      case 'subscription.charged': {
        const subscription = payload.payload.subscription.entity;
        console.log(`Subscription charged: ${subscription.id}`);
        
        // Find and update subscription
        const { data: existingSubscription } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('razorpay_subscription_id', subscription.id)
          .single();

        if (existingSubscription) {
          const periodEnd = new Date();
          if (existingSubscription.billing_cycle === 'yearly') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          await supabaseAdmin
            .from('subscriptions')
            .update({
              current_period_start: new Date().toISOString(),
              current_period_end: periodEnd.toISOString(),
              status: 'active',
            })
            .eq('id', existingSubscription.id);

          // Update profile expiry
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_expires_at: periodEnd.toISOString() })
            .eq('id', existingSubscription.user_id);
        }
        
        break;
      }

      case 'subscription.cancelled': {
        const subscription = payload.payload.subscription.entity;
        console.log(`Subscription cancelled: ${subscription.id}`);
        
        // Find and update subscription
        const { data: existingSubscription } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('razorpay_subscription_id', subscription.id)
          .single();

        if (existingSubscription) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('id', existingSubscription.id);

          // Update profile to free tier
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: 'free',
              subscription_expires_at: null,
            })
            .eq('id', existingSubscription.user_id);
        }
        
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in razorpay-webhook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
