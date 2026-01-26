
# Fix: Ads Not Loading for Free Users

## Problem Analysis
The screenshot shows "ADVERTISEMENT" and "RECOMMENDED FOR YOU" labels with empty content areas. This indicates:
1. The components ARE rendering (meaning `shouldShowAd` is `true` for a free user)
2. But the ad network scripts are NOT loading/executing properly

## Root Causes Identified

### Issue 1: AdBanner Script Injection Race Condition
The current implementation clears the container and creates scripts on every re-render, but the `scriptLoadedRef` guard doesn't properly handle React's strict mode and component lifecycle.

### Issue 2: RecommendationWidget Not Refreshing AdProvider
The ExoClick widget requires calling `AdProvider.push({ serve: {} })` AFTER the `ins` element is in the DOM, but the current logic may call it before React has fully rendered the element.

### Issue 3: Missing Error Handling
No fallback or error states when ads fail to load, leaving blank spaces visible.

### Issue 4: Cleanup Logic Conflicts
The cleanup functions set refs to `false`, but this can cause issues with React 18 strict mode which mounts/unmounts/remounts components.

---

## Implementation Plan

### 1. Fix AdBanner Component
**File:** `src/components/AdBanner.tsx`

Changes:
- Add proper script load detection using a more robust approach
- Add a "loaded" state to track when ad content appears
- Add fallback UI when ads fail to load after timeout
- Use `useLayoutEffect` to ensure DOM is ready before script injection
- Add retry logic for failed ad loads
- Show a subtle placeholder or hide container if ad fails

```
Key changes:
1. Add adLoaded state + failedToLoad state
2. Add 5-second timeout to detect load failures
3. If failed, hide the entire container (not just content)
4. Use MutationObserver to detect when iframe/content appears
5. Add proper cleanup without breaking re-initialization
```

### 2. Fix RecommendationWidget Component
**File:** `src/components/RecommendationWidget.tsx`

Changes:
- Delay AdProvider.push() call until after component mounts
- Use requestAnimationFrame or setTimeout to ensure DOM readiness
- Add error boundary for ad loading failures
- Add fallback when no ads available
- Track load state and hide if no content appears

```
Key changes:
1. Add loaded state tracking
2. Use setTimeout(0) to push to AdProvider after render
3. Add MutationObserver to detect content insertion
4. Hide entire widget if no content loads after timeout
5. Add proper script error handling
```

### 3. Add Loading States & Fallbacks
Both components should:
- Show nothing (or minimal placeholder) while loading
- Hide completely if ad fails to load (no empty "ADVERTISEMENT" labels)
- Track whether actual ad content was inserted into the container

---

## Technical Details

### AdBanner Fix Strategy
```typescript
// Improved structure
export const AdBanner = memo(function AdBanner(...) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (!shouldShowAd || loading) return;
    
    // Set timeout for load failure detection
    timeoutRef.current = setTimeout(() => {
      if (!adLoaded) setLoadFailed(true);
    }, 5000);
    
    // Use MutationObserver to detect when iframe appears
    const observer = new MutationObserver((mutations) => {
      const hasContent = containerRef.current?.querySelector('iframe');
      if (hasContent) {
        setAdLoaded(true);
        clearTimeout(timeoutRef.current);
      }
    });
    
    // ... script injection logic
    
    return () => {
      clearTimeout(timeoutRef.current);
      observer.disconnect();
    };
  }, [shouldShowAd, loading]);
  
  // Don't render if loading, premium, OR ad failed to load
  if (loading || !shouldShowAd || loadFailed) return null;
});
```

### RecommendationWidget Fix Strategy
```typescript
// Improved structure  
export const RecommendationWidget = memo(function RecommendationWidget(...) {
  const [hasContent, setHasContent] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  
  useEffect(() => {
    if (!shouldShowAd || loading) return;
    
    const initAd = () => {
      // Ensure DOM is ready
      requestAnimationFrame(() => {
        (window.AdProvider = window.AdProvider || []).push({ serve: {} });
      });
    };
    
    // Check for existing script or load new one
    // ... script loading logic with onload callback
    
    // Monitor for content insertion
    const timeout = setTimeout(() => {
      const container = containerRef.current;
      if (!container?.querySelector('*:not(.eas6a97888e20)')) {
        setLoadFailed(true);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [shouldShowAd, loading]);
  
  if (loading || !shouldShowAd || loadFailed) return null;
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AdBanner.tsx` | Fix script injection, add load detection, hide on failure |
| `src/components/RecommendationWidget.tsx` | Fix AdProvider timing, add content detection, hide on failure |

---

## Expected Behavior After Fix

1. **For Premium Users**: Components return `null` immediately, no labels shown
2. **For Free Users with Working Ads**: Labels + ad content display correctly
3. **For Free Users with Blocked/Failed Ads**: Components hide completely (no empty labels)
4. **On Ad Blockers**: Components detect no content loaded and hide gracefully

---

## Testing Notes
- Test with a free user account to verify ads load
- Test with ad blocker enabled to verify graceful fallback
- Verify premium users see no ad components at all
- Check that no console errors occur during ad loading
