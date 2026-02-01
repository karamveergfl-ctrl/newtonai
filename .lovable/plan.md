
# Plan: Fix SmartBanner Ads Not Showing

## Root Cause Analysis

The Adsterra banner ads are not displaying due to **two critical bugs** in the SmartBanner component:

### Bug 1: Iframe Never Renders (Main Issue)
The component returns `null` at line 157 when `!isAdConfirmed` is true:
```javascript
if (!isAdConfirmed || !adHtml) return null;
```
This means:
- When `adHtml` is received, the component still returns `null` because `isAdConfirmed` is `false`
- The iframe never gets rendered
- The `onLoad` event never fires
- `isAdConfirmed` stays `false` forever
- The ad never appears

### Bug 2: Stale Closure in Timeout
The timeout callback captures `isAdConfirmed` at creation time (always `false`), so even if `onLoad` fired, the timeout would still collapse the ad.

## Solution

Render the iframe as soon as `adHtml` is available, but keep it **visually hidden** until `onLoad` confirms the content loaded. Use a ref to track confirmation state for the timeout check.

### Changes to `src/components/SmartBanner.tsx`

1. **Add a ref to track confirmation** (avoids closure issues)
   ```typescript
   const isConfirmedRef = useRef(false);
   ```

2. **Update handleIframeLoad to set the ref**
   ```typescript
   const handleIframeLoad = useCallback(() => {
     clearTimeout(timeoutRef.current);
     isConfirmedRef.current = true;  // Set ref first
     setIsAdConfirmed(true);         // Then state
     if (placement === "A") {
       setPlacementALoaded(true);
     }
   }, [placement, setPlacementALoaded]);
   ```

3. **Fix timeout to use ref instead of state**
   ```typescript
   timeoutRef.current = setTimeout(() => {
     if (!isConfirmedRef.current) {  // Check ref, not state
       setAdHtml(null);
     }
   }, 2500);
   ```

4. **Fix render logic - render iframe when adHtml available, hide until confirmed**
   ```typescript
   // For B/C placements waiting for visibility
   if (placement !== "A" && !isVisible && !hasAttempted) {
     return <div ref={containerRef} className="h-0 w-0" />;
   }

   // No ad content yet - render nothing
   if (!adHtml) return null;

   // Render iframe - but hide container until confirmed
   return (
     <div
       ref={containerRef}
       className={cn(
         "w-full flex flex-col items-center my-6",
         !isAdConfirmed && "opacity-0 h-0 overflow-hidden", // Hidden until confirmed
         className
       )}
     >
       <span className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wider">
         Sponsored
       </span>
       <iframe
         srcDoc={adHtml}
         onLoad={handleIframeLoad}
         sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
         className="border-0 w-[300px] h-[250px] overflow-hidden rounded-lg"
         title="Advertisement"
         loading={placement === "A" ? "eager" : "lazy"}
       />
     </div>
   );
   ```

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/components/SmartBanner.tsx` | Add `isConfirmedRef`, fix timeout closure, fix render logic to show iframe while hidden until confirmed |

## Expected Result

1. Edge function returns ad HTML (verified working)
2. SmartBanner receives `adHtml`
3. Iframe renders (hidden via CSS)
4. Adsterra script loads in iframe
5. `onLoad` fires → `isAdConfirmed` becomes true
6. Container becomes visible with "Sponsored" label
7. Timeout is cleared, no collapse occurs

The ads will now display properly on all pages including `/tools/quiz`.
