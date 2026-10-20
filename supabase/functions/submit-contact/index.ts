import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const Body = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: "Please check the form fields.", details: parsed.error.flatten().fieldErrors }, 400);
  const d = parsed.data;
  const email = d.email.toLowerCase();

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Rate limit: max 3 messages per email per hour
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("contact_submissions").select("id", { count: "exact", head: true })
    .eq("email", email).gte("created_at", since);
  if ((count ?? 0) >= 3) return json({ error: "Too many messages. Please try again later." }, 429);

  const { data: row, error } = await admin.from("contact_submissions").insert({
    first_name: d.firstName, last_name: d.lastName, email, subject: d.subject, message: d.message,
  }).select("id").single();
  if (error) { console.error("insert failed", error); return json({ error: "Could not save your message." }, 500); }

  // Best-effort owner notification via Resend (submission is already stored)
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL")?.trim();
  if (key && from) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `contact-${row.id}` },
        body: JSON.stringify({
          from: `NewtonAI Contact <${from}>`,
          to: ["support@newtonai.site"],
          reply_to: email,
          subject: `[Contact] ${d.subject}`,
          html: `<p><b>From:</b> ${esc(d.firstName)} ${esc(d.lastName)} &lt;${esc(email)}&gt;</p><p><b>Subject:</b> ${esc(d.subject)}</p><p style="white-space:pre-wrap">${esc(d.message)}</p>`,
        }),
      });
      if (!r.ok) console.error("resend failed", r.status, await r.text());
    } catch (e) { console.error("resend error", e); }
  }

  return json({ ok: true, id: row.id });
});
