import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // GET - List all codes
    if (req.method === "GET" && !action) {
      const { data: codes, error } = await supabaseAdmin
        .from("redeem_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ codes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET - Redemption history
    if (req.method === "GET" && action === "history") {
      const codeId = url.searchParams.get("code_id");

      if (!codeId) {
        return new Response(JSON.stringify({ error: "code_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get redemptions with user info
      const { data: redemptions, error } = await supabaseAdmin
        .from("redeemed_codes")
        .select("id, user_id, discount_percent, redeemed_at")
        .eq("code_id", codeId)
        .order("redeemed_at", { ascending: false });

      if (error) throw error;

      // Get user details for each redemption
      const userIds = [...new Set(redemptions?.map((r) => r.user_id) || [])];

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();

      const redemptionsWithUsers = redemptions?.map((r) => {
        const profile = profiles?.find((p) => p.id === r.user_id);
        const authUser = authUsers?.users?.find((u) => u.id === r.user_id);

        return {
          ...r,
          user_name: profile?.full_name || null,
          user_email: authUser?.email || "Unknown",
        };
      });

      return new Response(JSON.stringify({ redemptions: redemptionsWithUsers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Create code
    if (req.method === "POST" && action === "create") {
      const body = await req.json();

      const { data: existing } = await supabaseAdmin
        .from("redeem_codes")
        .select("id")
        .eq("code", body.code.toUpperCase())
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: "Code already exists" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newCode, error } = await supabaseAdmin
        .from("redeem_codes")
        .insert({
          code: body.code.toUpperCase(),
          discount_percent: body.discount_percent,
          description: body.description,
          max_uses: body.max_uses,
          valid_from: body.valid_from,
          valid_until: body.valid_until,
          is_active: body.is_active,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ code: newCode }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Update code
    if (req.method === "POST" && action === "update") {
      const body = await req.json();

      const { data: updatedCode, error } = await supabaseAdmin
        .from("redeem_codes")
        .update({
          discount_percent: body.discount_percent,
          description: body.description,
          max_uses: body.max_uses,
          valid_from: body.valid_from,
          valid_until: body.valid_until,
          is_active: body.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ code: updatedCode }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Toggle active
    if (req.method === "POST" && action === "toggle-active") {
      const body = await req.json();

      const { error } = await supabaseAdmin
        .from("redeem_codes")
        .update({
          is_active: body.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in admin-redeem-codes:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
