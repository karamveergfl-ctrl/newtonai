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
    
    // Create client with user's auth token for role check
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

    // Get user ID
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseUser.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for data aggregation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get all analytics data in parallel
    const [
      profilesResult,
      subscriptionsResult,
      paymentsResult,
      featureUsageResult,
      recentUsersResult,
      enterpriseInquiriesResult,
    ] = await Promise.all([
      // User counts by tier
      supabaseAdmin.from("profiles").select("subscription_tier, created_at"),
      // Active subscriptions
      supabaseAdmin.from("subscriptions").select("*").eq("status", "active"),
      // Payments
      supabaseAdmin.from("payments").select("amount, status, created_at").eq("status", "captured"),
      // Feature usage
      supabaseAdmin.from("feature_usage").select("feature_name, usage_count, usage_minutes"),
      // Recent users with auth data
      supabaseAdmin.from("profiles").select("id, full_name, subscription_tier, created_at, updated_at").order("created_at", { ascending: false }).limit(20),
      // Enterprise inquiries count
      supabaseAdmin.from("enterprise_inquiries").select("status"),
    ]);

    const profiles = profilesResult.data || [];
    const subscriptions = subscriptionsResult.data || [];
    const payments = paymentsResult.data || [];
    const featureUsage = featureUsageResult.data || [];
    const recentUsers = recentUsersResult.data || [];
    const inquiries = enterpriseInquiriesResult.data || [];

    // Calculate overview stats
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUsers = profiles.length;
    const freeUsers = profiles.filter((p) => p.subscription_tier === "free").length;
    const proUsers = profiles.filter((p) => p.subscription_tier === "pro").length;
    const ultraUsers = profiles.filter((p) => p.subscription_tier === "ultra").length;

    const newUsersToday = profiles.filter((p) => new Date(p.created_at) >= todayStart).length;
    const newUsersThisWeek = profiles.filter((p) => new Date(p.created_at) >= weekStart).length;

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const monthlyRevenue = payments
      .filter((p) => new Date(p.created_at) >= monthStart)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Aggregate feature usage
    const featureStats: Record<string, { count: number; minutes: number }> = {};
    for (const usage of featureUsage) {
      if (!featureStats[usage.feature_name]) {
        featureStats[usage.feature_name] = { count: 0, minutes: 0 };
      }
      featureStats[usage.feature_name].count += usage.usage_count || 0;
      featureStats[usage.feature_name].minutes += usage.usage_minutes || 0;
    }

    const featureUsageArray = Object.entries(featureStats)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        minutes: stats.minutes,
      }))
      .sort((a, b) => b.count - a.count);

    // Enterprise inquiries stats
    const pendingInquiries = inquiries.filter((i) => i.status === "pending").length;
    const totalInquiries = inquiries.length;

    // Get user emails from auth.users for recent users
    const userIds = recentUsers.map((u) => u.id);
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailMap: Record<string, string> = {};
    if (authUsers?.users) {
      for (const authUser of authUsers.users) {
        emailMap[authUser.id] = authUser.email || "";
      }
    }

    const recentUsersWithEmail = recentUsers.map((u) => ({
      ...u,
      email: emailMap[u.id] || "N/A",
    }));

    const analytics = {
      overview: {
        totalUsers,
        freeUsers,
        proUsers,
        ultraUsers,
        activeSubscriptions: subscriptions.length,
        totalRevenue,
        monthlyRevenue,
        newUsersToday,
        newUsersThisWeek,
        pendingInquiries,
        totalInquiries,
      },
      featureUsage: featureUsageArray,
      recentUsers: recentUsersWithEmail,
      tierDistribution: [
        { name: "Free", value: freeUsers, fill: "hsl(var(--muted))" },
        { name: "Pro", value: proUsers, fill: "hsl(var(--primary))" },
        { name: "Ultra", value: ultraUsers, fill: "hsl(var(--secondary))" },
      ],
    };

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch analytics" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
