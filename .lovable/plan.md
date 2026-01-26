
# Plan: Revert Ads to Previous State & Add Mobile Support

## Overview
This plan will:
1. **Revert ad components** to their simpler previous implementation (remove the MutationObserver/timeout logic)
2. **Add responsive mobile ad support** using different ad sizes for mobile vs desktop

---

## Current Issues

### AdBanner Component
- The 728x90 ad format is **desktop-only** - too wide for mobile screens
- Current complex logic with MutationObserver and timeouts may be causing issues
- Need to add a mobile-responsive ad size (320x50 or 300x250)

### RecommendationWidget Component
- Similar complexity issues with MutationObserver
- Widget should work on all devices but needs simpler initialization

---

## Implementation

### 1. Simplify AdBanner Component

**File:** `src/components/AdBanner.tsx`

Changes:
- Remove `MutationObserver` and timeout logic
- Remove `adLoaded`, `loadFailed` states
- Keep the simple script injection approach
- Add responsive ad sizing:
  - **Desktop (≥768px):** 728x90 banner
  - **Mobile (<768px):** 320x50 or 300x250 banner
- Use `useIsMobile()` hook to detect device

```
Structure:
- Use useIsMobile() to determine ad size
- Desktop: 728x90 HighPerformanceFormat ad
- Mobile: 320x50 or 300x100 mobile banner ad
- Simple script injection without complex detection
- Always show the ad container (let ad network handle failures)
```

### 2. Simplify RecommendationWidget Component

**File:** `src/components/RecommendationWidget.tsx`

Changes:
- Remove `MutationObserver` and timeout logic
- Remove `hasContent`, `loadFailed` states
- Simple script load and AdProvider initialization
- Widget is already responsive by nature

```
Structure:
- Simple script injection
- Basic AdProvider.push() call
- Always render the container
- Let ad network handle content/failures
```

---

## Responsive Ad Strategy

| Screen Size | Ad Format | Dimensions |
|-------------|-----------|------------|
| Desktop (≥768px) | Banner | 728x90 |
| Mobile (<768px) | Mobile Banner | 320x50 |

The HighPerformanceFormat network supports multiple ad sizes. We'll use conditional rendering based on screen width.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AdBanner.tsx` | Simplify logic, add mobile responsive ads |
| `src/components/RecommendationWidget.tsx` | Simplify logic, ensure works on all devices |

---

## Technical Details

### AdBanner - Simplified with Mobile Support
```typescript
// Key changes:
const isMobile = useIsMobile();

// Different ad config for mobile vs desktop
const adConfig = isMobile 
  ? { key: 'MOBILE_AD_KEY', width: 320, height: 50 }
  : { key: 'c5d398ab0a723a7cfa61f3c2d7960602', width: 728, height: 90 };

// Simple script injection without complex detection
useEffect(() => {
  if (!shouldShowAd || loading) return;
  
  const container = containerRef.current;
  if (!container) return;

  const optionsScript = document.createElement('script');
  optionsScript.innerHTML = `
    atOptions = {
      'key': '${adConfig.key}',
      'format': 'iframe',
      'height': ${adConfig.height},
      'width': ${adConfig.width},
      'params': {}
    };
  `;
  
  const invokeScript = document.createElement('script');
  invokeScript.src = `https://www.highperformanceformat.com/${adConfig.key}/invoke.js`;
  invokeScript.async = true;
  
  container.appendChild(optionsScript);
  container.appendChild(invokeScript);
}, [shouldShowAd, loading, isMobile]);
```

### RecommendationWidget - Simplified
```typescript
// Remove all MutationObserver/timeout logic
// Simple initialization:
useEffect(() => {
  if (!shouldShowAd || loading) return;
  
  const existingScript = document.querySelector('script[src*="ad-provider.js"]');
  
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = 'https://a.magsrv.com/ad-provider.js';
    script.async = true;
    script.onload = () => {
      (window.AdProvider = window.AdProvider || []).push({ serve: {} });
    };
    document.head.appendChild(script);
  } else {
    (window.AdProvider = window.AdProvider || []).push({ serve: {} });
  }
}, [shouldShowAd, loading]);
```

---

## Expected Behavior After Changes

1. **Desktop users:** See 728x90 banner ads
2. **Mobile users:** See 320x50 mobile-optimized banner ads
3. **All devices:** Recommendation widget displays
4. **Premium users:** No ads shown (handled by useAdVisibility)
5. **Ad failures:** Container remains but shows empty (ad network's responsibility)

---

## Note on Ad Keys
The current ad key (`c5d398ab0a723a7cfa61f3c2d7960602`) is for 728x90 desktop ads. For mobile, you may need to:
- Create a separate ad zone in HighPerformanceFormat dashboard for mobile (320x50)
- Or use the same key if the network auto-adapts (some do)

If a separate mobile ad key is needed, you'll need to get it from the ad network dashboard.
