

# Plan: Load First Ad Immediately, Others After Delay

## Summary

I'll modify the ad loading strategy so that:
1. **`PrimaryAdBanner`** (the first/hero ad) loads **immediately** when user arrives on the page
2. **`AdBanner`** (secondary ads) keeps the **3-second delay** to avoid overwhelming the page

This approach prioritizes showing the most important ad slot instantly while keeping page performance smooth.

---

## Does Reducing Ad Count Affect Loading?

**Answer:** Reducing the number of ads on a page has **minimal impact** on initial loading speed because:

- Each ad loads **asynchronously** (via `async` script tag)
- Ads don't block each other or the main page content
- The delay is artificial (setTimeout), not due to network congestion

**The real issue is the 3-second delay** - by removing it from `PrimaryAdBanner`, the first ad will appear instantly.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/PrimaryAdBanner.tsx` | Remove 3-second delay - load immediately |
| `src/components/AdBanner.tsx` | Keep 3-second delay for secondary ads |

---

## Implementation

### PrimaryAdBanner.tsx (Load Immediately)

Remove the `showAd` state and setTimeout, inject script directly on mount:

```tsx
export function PrimaryAdBanner({ className }: PrimaryAdBannerProps) {
  const { isPremium, loading } = useCreditsContext();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Load immediately - no delay
    if (scriptLoaded.current || !adContainerRef.current) return;
    if (!loading && isPremium) return;
    
    scriptLoaded.current = true;

    (window as any).atOptions = {
      key: 'fe9d10672684b2efb3db57ecdb954f85',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    };

    const script = document.createElement('script');
    script.src = 'https://lozengehelped.com/fe9d10672684b2efb3db57ecdb954f85/invoke.js';
    script.async = true;
    adContainerRef.current.appendChild(script);

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, [isPremium, loading]);

  // ... rest stays the same
}
```

### AdBanner.tsx (Keep 3-Second Delay)

No changes needed - keeps the current 3-second delay for secondary placements.

---

## Loading Strategy

| Component | When It Loads | Where It's Used |
|-----------|---------------|-----------------|
| `PrimaryAdBanner` | **Immediately** (0s) | Hero slot below upload areas on tool pages |
| `AdBanner` | After 3 seconds | Footer areas, mid-page, promo sections |

---

## Why This Works

1. **User sees first ad instantly** - no wait time for the primary slot
2. **Secondary ads load smoothly** - 3-second delay prevents layout shifts
3. **No performance impact** - async loading doesn't block anything
4. **Better fill rate** - immediate impressions for the hero ad slot

---

## Expected Behavior

| Time | What User Sees |
|------|----------------|
| 0s | Page loads, `PrimaryAdBanner` starts loading immediately |
| ~0.5s | First ad appears in primary slot |
| 3s | Secondary `AdBanner` ads start loading |
| ~3.5s | All remaining ads visible |

