import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client for auth validation
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for bypassing RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const { duration } = await req.json();

    // Validate duration
    if (duration !== 30 && duration !== 60) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid duration. Must be 30 or 60." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current ad stats using RPC
    const { data: stats, error: statsError } = await userClient.rpc("get_ad_stats");
    
    if (statsError) {
      console.error("Stats error:", statsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch stats" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check limits
    if (stats.ads_remaining <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Daily ad limit reached",
          stats 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate reward
    const baseReward = duration === 30 ? 10 : 20;
    const isFirstAd = stats.ads_watched === 0;
    const bonusReward = isFirstAd ? 5 : 0;
    const totalReward = baseReward + bonusReward;

    // Check if this would exceed daily credit limit
    if (stats.credits_earned + totalReward > stats.max_credits) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Would exceed daily credit limit",
          stats 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create ad session using service role (bypasses RLS)
    const { data: session, error: sessionError } = await serviceClient
      .from("ad_sessions")
      .insert({
        user_id: userId,
        duration,
        reward: totalReward,
        ad_type: "smartlink", // Default to smartlink for now
        status: "pending",
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get ad URLs from environment
    // Priority: Outstream (SDK) > VAST (In-Stream) > Smartlink
    const outstreamZoneId = Deno.env.get("OUTSTREAM_ZONE_ID") || null;
    const vastUrl = Deno.env.get("VAST_TAG_URL") || null;
    const smartlinkUrl = Deno.env.get("SMARTLINK_URL") || Deno.env.get("ADSTERRA_SMARTLINK_URL") || null;

    // Determine ad type - prefer Outstream > VAST > Smartlink
    let adType: string;
    let provider: string;
    
    if (outstreamZoneId) {
      adType = "outstream";
      provider = "exoclick";
    } else if (vastUrl) {
      adType = "vast";
      provider = "exoclick";
    } else if (smartlinkUrl) {
      adType = "smartlink";
      provider = "adsterra";
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "No ad sources configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session.id,
        type: adType,
        provider,
        // Outstream SDK fields
        outstream_zone_id: outstreamZoneId,
        outstream_script: outstreamZoneId ? "https://a.magsrv.com/ad-provider.js" : null,
        // VAST fields
        vast_url: vastUrl,
        // Smartlink fields  
        smartlink_url: smartlinkUrl,
        // Common fields
        duration,
        reward: totalReward,
        is_first_ad: isFirstAd,
        bonus: bonusReward,
        stats,
        // Retry and fallback configuration
        retry_allowed: !!(vastUrl || outstreamZoneId),
        fallback_allowed_after_ms: 3000,
        max_retries: 1,
        retry_delay_ms: 1000,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ads-request:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
