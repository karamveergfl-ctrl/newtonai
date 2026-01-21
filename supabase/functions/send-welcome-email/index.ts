import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = name || "there";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NewtonAI <onboarding@resend.dev>",
        to: [email],
        subject: "🎉 Welcome to NewtonAI - Your AI Study Companion!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.3);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px;">Welcome to NewtonAI! 🚀</h1>
                        <p style="color: #a78bfa; font-size: 16px; margin: 0;">Your AI-powered study companion</p>
                      </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                      <td style="padding: 20px 40px;">
                        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">
                          Hey ${displayName}! 👋
                        </p>
                        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 16px 0 0;">
                          You've just unlocked your <strong style="color: #22c55e;">Free Plan</strong> with access to powerful AI study tools. Here's what you can do:
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Free Plan Features -->
                    <tr>
                      <td style="padding: 10px 40px 30px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(139, 92, 246, 0.1); border-radius: 12px; padding: 20px; border: 1px solid rgba(139, 92, 246, 0.2);">
                          <tr>
                            <td style="padding: 10px;">
                              <p style="color: #a78bfa; font-size: 14px; font-weight: 600; margin: 0 0 15px;">YOUR FREE PLAN INCLUDES:</p>
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">📹 <strong>20 Video Explanations</strong>/month</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">📝 <strong>3 AI Quizzes, Flashcards & Mind Maps</strong>/month</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">📄 <strong>2 AI Notes & Summaries</strong>/month</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">🎙️ <strong>1 AI Podcast</strong>/month</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">✏️ <strong>5 Homework Helps</strong>/day</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">🎤 <strong>20 min Transcription</strong>/month</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td style="padding: 0 40px 30px; text-align: center;">
                        <a href="https://newtonai.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                          Start Studying Now →
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Upgrade Teaser -->
                    <tr>
                      <td style="padding: 20px 40px; background: rgba(34, 197, 94, 0.1); border-top: 1px solid rgba(34, 197, 94, 0.2);">
                        <p style="color: #22c55e; font-size: 14px; font-weight: 600; margin: 0 0 10px;">💎 WANT UNLIMITED ACCESS?</p>
                        <p style="color: #e2e8f0; font-size: 14px; line-height: 1.5; margin: 0;">
                          Upgrade to <strong>Pro</strong> or <strong>Ultra</strong> for unlimited videos, homework help, and more!
                          <a href="https://newtonai.lovable.app/pricing" style="color: #a78bfa; text-decoration: underline;">View Plans</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="color: #64748b; font-size: 12px; margin: 0;">
                          Happy studying! 📚<br>
                          The NewtonAI Team
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    const result = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Welcome email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
