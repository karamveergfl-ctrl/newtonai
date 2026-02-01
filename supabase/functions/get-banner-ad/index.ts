import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Ad configuration - Adsterra primary, Monetag fallback
const ADSTERRA_KEY = "c5d398ab0a723a7cfa61f3c2d7960602";
const MONETAG_ZONE_ID = Deno.env.get("MONETAG_ZONE_ID") || "";

interface BannerAdResponse {
  provider: "adsterra" | "monetag" | null;
  ad_html: string | null;
}

/**
 * Generates Adsterra banner ad HTML
 * Uses iframe format for 300x250 banner
 */
function getAdsterraBannerHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      display: flex; 
      justify-content: center; 
      align-items: center;
      min-height: 90px;
      background: transparent;
    }
  </style>
</head>
<body>
  <script>
    atOptions = {
      'key' : '${ADSTERRA_KEY}',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script src="https://lozengehelped.com/${ADSTERRA_KEY}/invoke.js"></script>
</body>
</html>`;
}

/**
 * Generates Monetag banner ad HTML (fallback)
 * Only used if Monetag zone ID is configured
 */
function getMontagBannerHtml(): string | null {
  if (!MONETAG_ZONE_ID) return null;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      display: flex; 
      justify-content: center; 
      align-items: center;
      min-height: 90px;
      background: transparent;
    }
  </style>
</head>
<body>
  <script>
    (function(d,z,s){
      s.src='//'+d+'/401/'+z;
      try{(document.body||document.documentElement).appendChild(s)}
      catch(e){}
    })('grsjatbew.com','${MONETAG_ZONE_ID}',document.createElement('script'));
  </script>
</body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Primary: Adsterra
    const adsterraHtml = getAdsterraBannerHtml();
    if (adsterraHtml) {
      const response: BannerAdResponse = {
        provider: "adsterra",
        ad_html: adsterraHtml,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: Monetag
    const monetagHtml = getMontagBannerHtml();
    if (monetagHtml) {
      const response: BannerAdResponse = {
        provider: "monetag",
        ad_html: monetagHtml,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No ad available
    const response: BannerAdResponse = {
      provider: null,
      ad_html: null,
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
