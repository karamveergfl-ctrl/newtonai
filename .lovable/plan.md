

# Plan: Implement PropellerAds Banner Ads

## Overview

This plan implements PropellerAds banner ads with user-initiated loading (50% scroll trigger), premium user exclusion, deep study mode suppression, and iframe isolation for safe JavaScript execution.

---

## Architecture Design

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Ad Loading Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Page Load                                                     │
│       │                                                         │
│       ▼                                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Check Conditions:                                      │   │
│   │  • isPremium? → Don't show                              │   │
│   │  • isInDeepStudy? → Don't show                          │   │
│   │  • scrollPosition < 50%? → Wait                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼ (all conditions pass)                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Render isolated iframe with PropellerAds script        │   │
│   │  • srcDoc approach (no external JS pollution)           │   │
│   │  • Collapse on load failure                             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create

### 1. `src/hooks/useScrollProgress.ts` - Scroll Detection Hook

Recreate this hook (was deleted with previous cleanup) to detect when user has scrolled past 50% of the page.

**Implementation:**
- Subscribe to ScrollContext's `scrollPosition`
- Calculate percentage based on document height vs scroll position
- Return `{ scrollPercent: number, hasReachedThreshold: boolean }`

**Key Code Pattern:**
```typescript
export function useScrollProgress(threshold: number = 50) {
  const { scrollPosition } = useScrollContext();
  const [documentHeight, setDocumentHeight] = useState(0);
  
  // Calculate scroll percentage
  const scrollPercent = documentHeight > 0 
    ? (scrollPosition / documentHeight) * 100 
    : 0;
  
  return {
    scrollPercent,
    hasReachedThreshold: scrollPercent >= threshold
  };
}
```

---

### 2. `src/components/PropellerAdBanner.tsx` - Main Ad Component

**Props:**
- `className?: string` - Additional styling
- `adKey: string` - PropellerAds zone key (required)

**Behavior:**
1. Check `isPremium` from CreditsContext → hide if true
2. Check `isInDeepStudy` from StudyContext → hide if true  
3. Wait for 50% scroll threshold
4. Render ad in isolated iframe using `srcDoc`
5. Collapse container if ad fails to load (no empty placeholders)

**Key Features:**
- **Iframe Isolation**: Use `srcDoc` to contain PropellerAds JavaScript in its own context
- **Single Ad Limit**: Only one banner per page (no placements prop)
- **Graceful Failure**: Collapse container if script fails
- **No Retry**: Don't attempt to reload failed ads

**Component Structure:**
```typescript
interface PropellerAdBannerProps {
  className?: string;
  adKey: string;
}

export function PropellerAdBanner({ className, adKey }: PropellerAdBannerProps) {
  const { isPremium } = useCreditsContext();
  const { isInDeepStudy } = useStudyContext();
  const { hasReachedThreshold } = useScrollProgress(50);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't render for premium users or during deep study
  if (isPremium || isInDeepStudy) return null;
  
  // Wait for scroll threshold
  if (!hasReachedThreshold) return null;
  
  // Hide if ad failed
  if (adError) return null;

  return (
    <div className={cn("w-full flex justify-center my-6", className)}>
      <iframe
        srcDoc={buildPropellerAdHTML(adKey)}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="border-0 w-full max-w-[728px] h-[90px]"
        onLoad={() => setAdLoaded(true)}
        onError={() => setAdError(true)}
      />
    </div>
  );
}
```

---

## Files to Modify

### 3. `src/contexts/ScrollContext.tsx` - Add Percentage Calculation

**Changes:**
- Add `scrollPercent` to context value
- Calculate based on container scroll height
- Expose for ad component use

**Updated Interface:**
```typescript
interface ScrollContextType {
  hasScrolled: boolean;
  scrollPosition: number;
  scrollPercent: number;
  setScrollPosition: (position: number, containerHeight: number) => void;
}
```

---

### 4. `src/components/AppLayout.tsx` - Pass Container Height

**Changes:**
- Update `handleScroll` to also pass `scrollHeight` for percentage calculation

---

### 5. `src/components/tool-sections/ToolPagePromoSections.tsx` - Add Ad Banner

**Changes:**
- Import `PropellerAdBanner`
- Add single ad banner between Features and Trending Topics sections
- Only one ad per page (between promotional sections)

**Placement:**
```jsx
{/* Features Grid */}
<ToolPageFeatures features={data.features} />

{/* PropellerAds Banner - Single ad per page */}
<PropellerAdBanner adKey="YOUR_PROPELLER_ZONE_KEY" />

{/* Trending Topics */}
<ToolPageTrendingTopics />
```

---

### 6. `src/components/tool-sections/index.ts` - Export Ad Banner

**Changes:**
- Add export for `PropellerAdBanner` component

---

## PropellerAds Integration Details

### Ad Script Format

PropellerAds typically provides a script tag like:
```html
<script async="async" 
  data-cfasync="false" 
  src="//pl[ID].profitablegatecpm.com/[ZONE_KEY].js">
</script>
<div id="container-[ZONE_KEY]"></div>
```

### Iframe srcDoc Implementation

The component will build an isolated HTML document containing the PropellerAds script:

```typescript
function buildPropellerAdHTML(adKey: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; }
      </style>
    </head>
    <body>
      <div id="container-${adKey}"></div>
      <script async data-cfasync="false" 
        src="//pl.profitablegatecpm.com/${adKey}.js">
      </script>
    </body>
    </html>
  `;
}
```

---

## Configuration & Setup

### Required: PropellerAds Zone Key

After creating your PropellerAds account and getting approved:
1. Create a "Native Banner" or "Display Banner" zone in PropellerAds dashboard
2. Copy the zone key (usually a string like `abc123xyz`)
3. Add to environment variable or directly in component

**Recommendation**: Store as environment variable:
```
VITE_PROPELLER_AD_KEY=your_zone_key_here
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useScrollProgress.ts` | Create | Detect 50% scroll threshold |
| `src/components/PropellerAdBanner.tsx` | Create | Main ad component with isolation |
| `src/contexts/ScrollContext.tsx` | Modify | Add scroll percentage calculation |
| `src/components/AppLayout.tsx` | Modify | Pass container height for % calc |
| `src/components/tool-sections/ToolPagePromoSections.tsx` | Modify | Add ad banner placement |
| `src/components/tool-sections/index.ts` | Modify | Export ad component |

---

## Safety & Compliance Features

| Feature | Implementation |
|---------|----------------|
| User-initiated loading | 50% scroll threshold before ad loads |
| Premium exclusion | Check `isPremium` from CreditsContext |
| Deep study suppression | Check `isInDeepStudy` from StudyContext |
| Single ad per page | Only one `PropellerAdBanner` in ToolPagePromoSections |
| Iframe isolation | `srcDoc` approach prevents JS pollution |
| No auto-refresh | Ads don't reload on route changes |
| Graceful failure | Container collapses if ad fails to load |
| No empty placeholders | Component returns null on error |

---

## Testing Checklist

After implementation:
1. Scroll past 50% on a tool page → ad should appear
2. Log in as premium user → ad should NOT appear
3. Enter deep study mode (start a quiz) → ad should NOT appear
4. Check browser console for no JavaScript errors from ad script
5. Verify only one ad appears per page
6. Test ad failure by using invalid key → should collapse gracefully

