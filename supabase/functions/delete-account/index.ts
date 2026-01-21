import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    // Create admin client with service role to delete user data and auth account
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user's name from profile before deletion
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const userName = profile?.full_name || "User";

    // Delete user data from all tables (order matters due to potential dependencies)
    // Include ALL user-related tables for complete cleanup
    const tablesToClean = [
      { table: "podcasts", column: "user_id" },
      { table: "redeemed_codes", column: "user_id" },
      { table: "credit_transactions", column: "user_id" },
      { table: "user_credits", column: "user_id" },
      { table: "feature_usage", column: "user_id" },
      { table: "rate_limits", column: "user_id" },
      { table: "search_history", column: "user_id" },
      { table: "study_sessions", column: "user_id" },
      { table: "video_watch_time", column: "user_id" },
      // Note: subscriptions and payments are kept for financial records (immutable)
      { table: "profiles", column: "id" },
    ];

    const errors: string[] = [];

    for (const { table, column } of tablesToClean) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(column, userId);

      if (error) {
        console.error(`Failed to delete from ${table}:`, error);
        errors.push(`${table}: ${error.message}`);
      }
    }

    // Delete the user from auth.users
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("Failed to delete auth user:", deleteUserError);
      console.error("Data deletion errors:", errors);
      return new Response(
        JSON.stringify({ error: "Account deletion failed. Please try again or contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send confirmation email
    if (userEmail) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          
          await resend.emails.send({
            from: "NewtonAI <onboarding@resend.dev>",
            to: [userEmail],
            subject: "Your NewtonAI Account Has Been Deleted",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Account Deletion Confirmed</h1>
                  </div>
                  <div style="padding: 40px 30px;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi ${userName},</p>
                    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                      This email confirms that your NewtonAI account and all associated data have been permanently deleted as per your request.
                    </p>
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <h3 style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Data Deleted:</h3>
                      <ul style="font-size: 14px; color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Profile information</li>
                        <li>Credit transactions and balance</li>
                        <li>Feature usage history</li>
                        <li>Search history</li>
                        <li>Study sessions</li>
                        <li>Video watch history</li>
                        <li>Saved podcasts</li>
                        <li>Redeemed codes history</li>
                      </ul>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                      If you did not request this deletion, please contact our support team immediately.
                    </p>
                    <p style="font-size: 16px; color: #374151; margin-bottom: 8px;">Thank you for using NewtonAI.</p>
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">The NewtonAI Team</p>
                  </div>
                  <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                      This is an automated message. Please do not reply to this email.
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          console.log("Deletion confirmation email sent to:", userEmail);
        } else {
          console.warn("RESEND_API_KEY not configured, skipping confirmation email");
        }
      } catch (emailError) {
        // Don't fail the deletion if email fails
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account and all associated data deleted successfully",
        emailSent: !!userEmail,
        warnings: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in delete-account:", error);
    return new Response(
      JSON.stringify({ error: "Account deletion failed. Please try again or contact support." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
