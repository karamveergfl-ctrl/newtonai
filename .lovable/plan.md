
# Plan: Replace Adsterra Banner with 728x90 Leaderboard Format

## Overview

Replace the current 300x250 Adsterra banner with the new 728x90 leaderboard banner format. This requires updates to both the backend edge function and frontend component.

## Changes Required

### 1. Edge Function: `supabase/functions/get-banner-ad/index.ts`

**Current:**
- Key: `f68fadee12d992a26443bfb050da5b07`
- Dimensions: 300x250

**Updated:**
- Key: `c5d398ab0a723a7cfa61f3c2d7960602`
- Dimensions: 728x90

```typescript
// Update key constant
const ADSTERRA_KEY = "c5d398ab0a723a7cfa61f3c2d7960602";

// Update HTML template
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
```

### 2. Frontend Component: `src/components/SmartBanner.tsx`

**Current:**
- Iframe dimensions: `w-[300px] h-[250px]`

**Updated:**
- Iframe dimensions: `w-[728px] h-[90px]`
- Add max-width for mobile responsiveness

```tsx
<iframe
  srcDoc={adHtml}
  onLoad={handleIframeLoad}
  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
  className="border-0 w-[728px] max-w-full h-[90px] overflow-hidden rounded-lg"
  title="Advertisement"
  loading={placement === "A" ? "eager" : "lazy"}
/>
```

### 3. Legacy Component: `src/components/AdsterraBanner.tsx`

Also update the legacy component in case it's still used anywhere:

**Current:**
- Key: `f68fadee12d992a26443bfb050da5b07`
- Dimensions: 300x250

**Updated:**
- Key: `c5d398ab0a723a7cfa61f3c2d7960602`
- Dimensions: 728x90

## Summary of File Changes

| File | Changes |
|------|---------|
| `supabase/functions/get-banner-ad/index.ts` | Update key, change dimensions to 728x90 |
| `src/components/SmartBanner.tsx` | Update iframe dimensions to 728x90, add responsive max-width |
| `src/components/AdsterraBanner.tsx` | Update key and dimensions for consistency |

## Mobile Responsiveness

The 728x90 leaderboard format may be too wide for mobile devices. The `max-w-full` class will ensure:
- On desktop: Full 728px width displays
- On mobile: Banner scales down proportionally to fit viewport

## Result

After these changes:
1. Edge function returns the new 728x90 banner HTML
2. Frontend renders the wider leaderboard format
3. Banner scales responsively on mobile devices
4. All existing placements (A, B, C) work with new format
