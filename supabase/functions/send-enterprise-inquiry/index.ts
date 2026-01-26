import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EnterpriseInquiryRequest {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  teamSize: string;
  useCase: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;

    // Rate limiting check (3 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_function_name: 'send-enterprise-inquiry'
    });

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
      return new Response(
        JSON.stringify({ error: 'Rate limit check failed' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data: EnterpriseInquiryRequest = await req.json();

    // Server-side validation
    if (!data.firstName || !data.lastName || !data.email || !data.company || 
        !data.jobTitle || !data.teamSize || !data.useCase || !data.message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Input length validation
    if (data.firstName.length > 50 || data.lastName.length > 50 || 
        data.email.length > 255 || data.company.length > 100 || 
        data.jobTitle.length > 100 || data.message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum length" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Store inquiry in database (with RLS protection)
    const { error: insertError } = await supabase
      .from('enterprise_inquiries')
      .insert({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        company: data.company.trim(),
        job_title: data.jobTitle.trim(),
        team_size: data.teamSize,
        use_case: data.useCase,
        message: data.message.trim()
      });

    if (insertError) {
      console.error("Failed to store inquiry:", insertError);
      // Continue with email sending even if DB insert fails
    }

    // Send notification to admin
    const adminEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NewtonAI Enterprise <onboarding@resend.dev>",
        to: ["support@newtonAI.site"],
        subject: `Enterprise Inquiry: ${data.company} - ${data.teamSize} users`,
        html: `
          <h1>New Enterprise Inquiry</h1>
          <h2>Contact Information</h2>
          <ul>
            <li><strong>Name:</strong> ${data.firstName} ${data.lastName}</li>
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>Company:</strong> ${data.company}</li>
            <li><strong>Job Title:</strong> ${data.jobTitle}</li>
          </ul>
          <h2>Requirements</h2>
          <ul>
            <li><strong>Team Size:</strong> ${data.teamSize}</li>
            <li><strong>Use Case:</strong> ${data.useCase}</li>
          </ul>
          <h2>Message</h2>
          <p>${data.message.replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!adminEmailRes.ok) {
      const error = await adminEmailRes.text();
      console.error("Failed to send admin email:", error);
    }

    // Send confirmation to the user
    const userEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NewtonAI Enterprise <onboarding@resend.dev>",
        to: [data.email],
        subject: "Thank you for your enterprise inquiry - NewtonAI",
        html: `
          <h1>Thank you for contacting NewtonAI Enterprise, ${data.firstName}!</h1>
          <p>We've received your inquiry about NewtonAI for ${data.company}.</p>
          <p>Our enterprise team will review your requirements and get back to you within 24 hours.</p>
          <h2>What happens next?</h2>
          <ol>
            <li>Our team will review your requirements</li>
            <li>We'll schedule a demo call at your convenience</li>
            <li>You'll receive a custom proposal tailored to your needs</li>
          </ol>
          <p>If you have any urgent questions, feel free to reply to this email.</p>
          <p>Best regards,<br>The NewtonAI Enterprise Team</p>
        `,
      }),
    });

    if (!userEmailRes.ok) {
      const error = await userEmailRes.text();
      console.error("Failed to send user confirmation email:", error);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-enterprise-inquiry:", error);
    // Return generic error message to client
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
