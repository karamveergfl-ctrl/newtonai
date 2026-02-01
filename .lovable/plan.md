
# Plan: Remove Monetag Ads Completely

## Overview

Clean up all Monetag ad references from the codebase. Since the ad system has been simplified to use the inline `AdBanner` component (which only uses Adsterra), the Monetag fallback code and legacy components are no longer needed.

## Files to Modify/Delete

### 1. Delete Legacy Ad Files

These files are no longer used since the migration to the simplified `AdBanner`:

| File | Action | Reason |
|------|--------|--------|
| `src/components/SmartBanner.tsx` | DELETE | Replaced by simplified AdBanner |
| `src/components/AdsterraBanner.tsx` | DELETE | Legacy, no longer imported |
| `src/components/PropellerAdBanner.tsx` | DELETE | Legacy Ezmob component, unused |
| `src/contexts/BannerAdContext.tsx` | DELETE | No longer needed - AdBanner is self-contained |

### 2. Update App.tsx

Remove the `BannerAdProvider` wrapper since it's no longer used:

**Current:**
```tsx
import { BannerAdProvider } from "@/contexts/BannerAdContext";
// ...
<BannerAdProvider>
  <TooltipProvider>
    // ...
  </TooltipProvider>
</BannerAdProvider>
```

**Updated:**
```tsx
// Remove BannerAdProvider import and wrapper
<TooltipProvider>
  // ...
</TooltipProvider>
```

### 3. Simplify Edge Function (Optional)

Clean up `supabase/functions/get-banner-ad/index.ts` to remove Monetag fallback code. Note: This edge function is technically unused now since `AdBanner` embeds the ad HTML directly, but cleaning it up ensures no confusion.

**Remove:**
- `MONETAG_ZONE_ID` constant
- `getMontagBannerHtml()` function
- Monetag fallback logic in the serve handler
- `"monetag"` from the provider type

**Simplified version:**
```typescript
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
```

## Summary

| Action | Files |
|--------|-------|
| DELETE | `SmartBanner.tsx`, `AdsterraBanner.tsx`, `PropellerAdBanner.tsx`, `BannerAdContext.tsx` |
| UPDATE | `App.tsx` - remove BannerAdProvider |
| SIMPLIFY | `get-banner-ad/index.ts` - remove Monetag code |

## Result

After cleanup:
- Zero Monetag references in the codebase
- Cleaner, simpler ad architecture
- Only the self-contained `AdBanner` component remains
- Reduced bundle size by removing unused code
