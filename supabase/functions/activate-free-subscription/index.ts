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

    // Fetch code details for notification check
    const { data: codeData } = await supabaseAdmin
      .from('redeem_codes')
      .select('code, discount_percent, current_uses, max_uses')
      .eq('id', redeem_code_id)
      .single();

    // Send notifications for high-value or near-limit codes
    if (codeData) {
      const isHighValue = codeData.discount_percent === 100;
      const isNearLimit = codeData.max_uses && codeData.current_uses >= codeData.max_uses * 0.8;
      const isAlmostDepleted = codeData.max_uses && (codeData.max_uses - codeData.current_uses) <= 5;

      if (isHighValue || isNearLimit || isAlmostDepleted) {
        // Create admin notification
        let notifTitle: string;
        let notifMessage: string;
        
        if (isHighValue) {
          notifTitle = `🎉 100% Code Redeemed: ${codeData.code}`;
          notifMessage = `Free subscription activated for user ${user.email || user.id}. Usage: ${codeData.current_uses}/${codeData.max_uses || '∞'}`;
        } else {
          const percentUsed = codeData.max_uses ? Math.round((codeData.current_uses / codeData.max_uses) * 100) : 0;
          notifTitle = `⚠️ Code Nearing Limit: ${codeData.code}`;
          notifMessage = `${percentUsed}% used (${codeData.current_uses}/${codeData.max_uses}). Only ${codeData.max_uses! - codeData.current_uses} uses remaining.`;
        }

        await supabaseAdmin
          .from('admin_notifications')
          .insert({
            type: 'code_redemption',
            title: notifTitle,
            message: notifMessage,
            metadata: {
              code_id: redeem_code_id,
              code: codeData.code,
              discount_percent: codeData.discount_percent,
              current_uses: codeData.current_uses,
              max_uses: codeData.max_uses,
              user_email: user.email,
              is_high_value: isHighValue,
            },
          });

        // Send email notification
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey) {
          const emailSubject = isHighValue
            ? `🎉 High-Value Code Redeemed: ${codeData.code}`
            : `⚠️ Code Nearing Limit: ${codeData.code} (${Math.round((codeData.current_uses / codeData.max_uses!) * 100)}% used)`;

          const emailHtml = isHighValue
            ? `
              <h2>High-Value Code Redeemed</h2>
              <p>A 100% discount code was just used:</p>
              <ul>
                <li><strong>Code:</strong> ${codeData.code}</li>
                <li><strong>User:</strong> ${user.email || 'Unknown'}</li>
                <li><strong>Usage:</strong> ${codeData.current_uses}/${codeData.max_uses || '∞'}</li>
                <li><strong>Plan:</strong> ${plan_name} (${billing_cycle})</li>
              </ul>
              <p>This code grants full premium access without payment.</p>
            `
            : `
              <h2>Code Almost Depleted</h2>
              <p>A redeem code is running low on uses:</p>
              <ul>
                <li><strong>Code:</strong> ${codeData.code}</li>
                <li><strong>Discount:</strong> ${codeData.discount_percent}%</li>
                <li><strong>Usage:</strong> ${codeData.current_uses}/${codeData.max_uses}</li>
                <li><strong>Remaining:</strong> ${codeData.max_uses! - codeData.current_uses} uses</li>
              </ul>
              <p>Consider creating a replacement code if you want to continue offering this discount.</p>
            `;

          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: 'NewtonAI Alerts <onboarding@resend.dev>',
                to: ['admin@newtonai.site'],
                subject: emailSubject,
                html: emailHtml,
              }),
            });
            console.log('Admin email notification sent');
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
          }
        }
      }
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
