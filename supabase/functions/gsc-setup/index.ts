import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const LOV = Deno.env.get("LOVABLE_API_KEY");
  const GSC = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!LOV || !GSC) {
    return new Response(JSON.stringify({ error: "missing env", hasLov: !!LOV, hasGsc: !!GSC }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const headers = {
    Authorization: `Bearer ${LOV}`,
    "X-Connection-Api-Key": GSC,
    "Content-Type": "application/json",
  };

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "token";
  const site = "https://newtonai.site/";

  try {
    if (action === "token") {
      const r = await fetch(`${GATEWAY}/siteVerification/v1/token`, {
        method: "POST", headers,
        body: JSON.stringify({ site: { identifier: site, type: "SITE" }, verificationMethod: "META" }),
      });
      const text = await r.text();
      return new Response(text, { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "verify") {
      const r = await fetch(`${GATEWAY}/siteVerification/v1/webResource?verificationMethod=META`, {
        method: "POST", headers,
        body: JSON.stringify({ site: { identifier: site, type: "SITE" } }),
      });
      const text = await r.text();
      return new Response(text, { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "add-site") {
      const enc = encodeURIComponent(site);
      const r = await fetch(`${GATEWAY}/webmasters/v3/sites/${enc}`, { method: "PUT", headers });
      const text = await r.text();
      return new Response(text || JSON.stringify({ ok: r.ok, status: r.status }), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "submit-sitemap") {
      const enc = encodeURIComponent(site);
      const sm = encodeURIComponent("https://newtonai.site/sitemap.xml");
      const r = await fetch(`${GATEWAY}/webmasters/v3/sites/${enc}/sitemaps/${sm}`, { method: "PUT", headers });
      const text = await r.text();
      return new Response(text || JSON.stringify({ ok: r.ok, status: r.status }), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
