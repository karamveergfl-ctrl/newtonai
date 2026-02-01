
# Plan: Smart Banner Ad System with Routing

## Overview

Implement a comprehensive banner ad system with Adsterra as primary and Monetag as fallback, featuring smart routing logic, placement hierarchy, and study-mode safety rules.

## Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├──────────────────────────────────────────────────────────────────┤
│  SmartBannerContext (Global State)                               │
│  ├─ placementALoaded: boolean                                    │
│  ├─ cachedAdResponse: { provider, ad_html } | null               │
│  └─ setPlacementALoaded()                                        │
├──────────────────────────────────────────────────────────────────┤
│  SmartBanner Component                                           │
│  ├─ placement: "A" | "B" | "C"                                   │
│  ├─ Placement A: Always loads immediately                        │
│  ├─ Placement B: Lazy + requires A success + 2x viewport height  │
│  └─ Placement C: Lazy + requires A success                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   EDGE FUNCTION: get-banner-ad                   │
├──────────────────────────────────────────────────────────────────┤
│  1. Try Adsterra banner (primary)                                │
│  2. If fail → Try Monetag banner (fallback)                      │
│  3. Return { provider, ad_html } or null                         │
└──────────────────────────────────────────────────────────────────┘
```

## Files to Create

### 1. Edge Function: `supabase/functions/get-banner-ad/index.ts`

Backend endpoint for ad routing logic:
- Accepts no authentication (public banners)
- Tries Adsterra first, then Monetag fallback
- Returns standardized response: `{ provider: "adsterra" | "monetag", ad_html: string }`
- Returns `{ provider: null, ad_html: null }` if both fail

```typescript
// Response format
{
  provider: "adsterra" | "monetag" | null,
  ad_html: string | null
}
```

### 2. Context: `src/contexts/BannerAdContext.tsx`

Global state for banner ad coordination:
- Tracks if Placement A successfully loaded
- Caches ad response to avoid duplicate requests
- Provides `loadBannerAd()` function
- Exposes `placementALoaded` state for B/C placements

### 3. Component: `src/components/SmartBanner.tsx`

Unified banner component with placement logic:

| Placement | Location | Load Trigger | Conditions |
|-----------|----------|--------------|------------|
| A | Below action button | Immediate | Always attempts |
| B | Mid-page | Scroll (IntersectionObserver) | A loaded + page height ≥ 2x viewport |
| C | Above footer | Scroll (IntersectionObserver) | A loaded |

Features:
- Iframe isolation (srcDoc pattern from existing components)
- Premium user suppression (`isPremium` check)
- Deep study mode suppression (`isInDeepStudy` check)
- "Sponsored" label only after successful load
- Graceful collapse if no ad returned
- 300x250 primary size, responsive sizing support

### 4. Hook: `src/hooks/usePageHeight.ts`

Utility hook to detect page height for Placement B visibility:
- Returns `{ isLongPage: boolean }` (true if page ≥ 2x viewport)
- Uses ResizeObserver for dynamic content

## Files to Modify

### 5. Tool Pages (All 7 files)

Add Placement A immediately below the primary action button:

**Files:**
- `src/pages/tools/AIQuiz.tsx`
- `src/pages/tools/AIFlashcards.tsx`
- `src/pages/tools/AISummarizer.tsx`
- `src/pages/tools/AILectureNotes.tsx`
- `src/pages/tools/HomeworkHelp.tsx`
- `src/pages/tools/MindMap.tsx`
- `src/pages/tools/AIPodcast.tsx`

**Pattern:**
```tsx
<ContentInputTabs ... />
<SmartBanner placement="A" />  {/* NEW - Below input/action */}
<InlineRecents ... />
```

### 6. Promo Sections: `src/components/tool-sections/ToolPagePromoSections.tsx`

Replace existing ad components with SmartBanner placements B and C:

**Changes:**
- Replace `PropellerAdBanner` with `<SmartBanner placement="B" />`
- Replace `AdsterraBanner` with `<SmartBanner placement="C" />`

### 7. App Provider: `src/App.tsx`

Wrap app with `BannerAdProvider` for global state coordination.

### 8. Config File: `supabase/config.toml`

Add configuration for the new edge function:
```toml
[functions.get-banner-ad]
verify_jwt = false
```

## Suppression Rules (Inherited)

The SmartBanner component will NOT render when:
1. `isPremium === true` (from CreditsContext)
2. `isInDeepStudy === true` (from StudyContext)
3. Inside PDF viewer (no banner placements there)
4. Inside quiz questions (Placement A only on initial form)
5. Inside step-by-step solutions (no banners during solution display)

## Ad HTML Templates

### Adsterra (Primary)
```html
<script>
  atOptions = {
    'key': 'f68fadee12d992a26443bfb050da5b07',
    'format': 'iframe',
    'height': 250,
    'width': 300,
    'params': {}
  };
</script>
<script src="https://lozengehelped.com/f68fadee12d992a26443bfb050da5b07/invoke.js"></script>
```

### Monetag (Fallback)
Requires Monetag zone ID to be configured. Will use similar iframe-based pattern.

## Technical Details

| Aspect | Implementation |
|--------|----------------|
| Isolation | srcDoc iframe prevents JS pollution |
| Caching | Single request per page load, cached in context |
| Lazy loading | IntersectionObserver for B/C placements |
| Error handling | Collapse container if ad fails |
| Frequency | Same ad unit ID across all placements |
| Sizing | 300x250 primary, responsive containers |
| Labels | "Sponsored" appears only after ad loads |
| Max per page | 3 banners maximum (A, B, C) |

## Secrets Required

The Monetag fallback will require a Monetag API key or zone ID. This can be added later when the user provides it. The system will work with Adsterra only until Monetag is configured.

## Summary

1. Create edge function `get-banner-ad` for routing logic
2. Create `BannerAdContext` for global coordination
3. Create `SmartBanner` component with placement hierarchy
4. Create `usePageHeight` hook for mid-page detection
5. Update all 7 tool pages to add Placement A
6. Update `ToolPagePromoSections` with Placements B and C
7. Wrap app with `BannerAdProvider`
8. Remove global Adsterra script from `index.html` (now component-based)
