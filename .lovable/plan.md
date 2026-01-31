
# Plan: Add Adsterra 300x250 Banner Ad

## Overview

Create a new React component for the Adsterra banner ad (300x250) and integrate it into the tool pages. The Adsterra ad uses a different approach than Ezmob - it sets a global `atOptions` object and loads an invoke.js script.

## Files to Create/Modify

### 1. Create `src/components/AdsterraBanner.tsx` (New File)

A new component that:
- Renders the Adsterra ad in an isolated iframe (same pattern as PropellerAdBanner)
- Respects premium user exclusion
- Respects deep study mode suppression
- Uses 50% scroll trigger before loading
- Size: 300x250 (matching the Adsterra code)

```typescript
// Key properties:
// - adKey: 'f68fadee12d992a26443bfb050da5b07'
// - format: iframe
// - size: 300x250
// - source: lozengehelped.com
```

The component will build an isolated HTML document containing:
```html
<script>
  atOptions = {
    'key' : 'f68fadee12d992a26443bfb050da5b07',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script src="https://lozengehelped.com/f68fadee12d992a26443bfb050da5b07/invoke.js"></script>
```

### 2. Modify `src/components/tool-sections/ToolPagePromoSections.tsx`

Add the Adsterra banner alongside or replacing the existing Ezmob banner. Place it in a strategic location in the promo sections.

---

## Technical Details

| Aspect | Implementation |
|--------|----------------|
| Isolation | srcDoc iframe to prevent global JS pollution |
| Premium users | Hidden via `isPremium` check |
| Deep study mode | Hidden via `isInDeepStudy` check |
| Lazy loading | 50% scroll threshold trigger |
| Error handling | Graceful fallback if ad fails |
| Size | 300x250 (standard banner) |

## Ad Placement Strategy

The tool pages will have:
1. **Ezmob Banner** (existing) - After Features section
2. **Adsterra Banner** (new) - After FAQ section (before Why Use CTA)

This spreads ads throughout the page without overwhelming users, while maximizing viewability.
