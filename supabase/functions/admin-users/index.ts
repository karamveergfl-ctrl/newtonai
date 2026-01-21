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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: isAdmin, error: roleError } = await supabaseUser.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
      const search = url.searchParams.get("search") || "";

      // Get profiles with pagination
      let query = supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) {
        query = query.ilike("full_name", `%${search}%`);
      }

      const { data: profiles, count, error: profilesError } = await query;

      if (profilesError) {
        throw profilesError;
      }

      // Get emails from auth
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const emailMap: Record<string, string> = {};
      if (authData?.users) {
        for (const authUser of authData.users) {
          emailMap[authUser.id] = authUser.email || "";
        }
      }

      // Get user roles
      const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
      const roleMap: Record<string, string[]> = {};
      if (roles) {
        for (const role of roles) {
          if (!roleMap[role.user_id]) {
            roleMap[role.user_id] = [];
          }
          roleMap[role.user_id].push(role.role);
        }
      }

      const users = (profiles || []).map((profile) => ({
        ...profile,
        email: emailMap[profile.id] || "N/A",
        roles: roleMap[profile.id] || [],
      }));

      return new Response(
        JSON.stringify({ users, total: count || 0, page, pageSize }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "update-tier") {
        const { userId, tier } = body;
        if (!userId || !tier) {
          return new Response(
            JSON.stringify({ error: "Missing userId or tier" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ subscription_tier: tier })
          .eq("id", userId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "grant-admin") {
        const { userId } = body;
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Missing userId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "revoke-admin") {
        const { userId } = body;
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Missing userId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent self-revocation
        if (userId === user.id) {
          return new Response(
            JSON.stringify({ error: "Cannot revoke your own admin access" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Unknown action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin users error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
