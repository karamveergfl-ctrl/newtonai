import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADSTERRA_KEY = "c5d398ab0a723a7cfa61f3c2d7960602";

interface BannerAdResponse {
  provider: "adsterra" | null;
  ad_html: string | null;
}

function getAdsterraBannerHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; justify-content: center; align-items: center; min-height: 90px; background: transparent; }
  </style>
</head>
<body>
  <script>
    atOptions = { 'key': '${ADSTERRA_KEY}', 'format': 'iframe', 'height': 90, 'width': 728, 'params': {} };
  </script>
  <script src="https://lozengehelped.com/${ADSTERRA_KEY}/invoke.js"></script>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response: BannerAdResponse = {
      provider: "adsterra",
      ad_html: getAdsterraBannerHtml(),
    };
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Banner ad error:", error);
    return new Response(
      JSON.stringify({ provider: null, ad_html: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
