
## Plan: Fix Adsterra Ads - Switch from srcDoc Iframe to Direct Script Injection

### Problem Identified

The Adsterra dashboard shows 0 impressions today because **the `srcDoc` iframe approach cannot load external scripts**. This is a browser security restriction - iframes created with `srcDoc` have a unique "null" origin that blocks cross-origin script loading.

Current flow (broken):
```text
srcDoc iframe → tries to load invoke.js → BLOCKED by browser security → no ad loads → 0 impressions
```

### Solution

Replace the `srcDoc` iframe approach with **direct script injection** into the page DOM, which is the standard method for ad integrations in React applications.

---

### File Changes Required

**File: `src/components/NativeAdBanner.tsx`**

#### Complete Rewrite Strategy

1. **Remove the `generateAdHtml()` function and srcdoc iframe**
2. **Add a container div with a unique ID for each placement**
3. **Inject the Adsterra script directly into the DOM using `useEffect`**
4. **Clean up the script on unmount to prevent memory leaks**

#### New Implementation Approach

```text
Container div (unique ID per placement)
  ↓
useEffect injects Adsterra script into container
  ↓
Adsterra script loads invoke.js (works because it's in main document)
  ↓
Ad renders inside container → impressions tracked
```

---

### Technical Changes

| Component | Before | After |
|-----------|--------|-------|
| Ad loading method | `srcDoc` iframe | Direct script injection |
| Script execution context | Isolated iframe origin | Main document origin |
| External script loading | Blocked | Allowed |
| Impression tracking | Broken | Working |

---

### Key Implementation Details

1. **Unique container IDs**: Each ad placement gets a unique ID based on placement name to prevent conflicts
2. **Script cleanup**: Remove injected scripts on component unmount
3. **Lazy loading preserved**: Keep the IntersectionObserver for mid-page/above-footer placements
4. **Premium/study mode suppression**: Keep existing logic to hide ads for premium users and during deep study
5. **Remove timeout logic**: The 5-second timeout was masking the underlying issue; remove it since ads will now load properly

---

### Files Modified

1. **`src/components/NativeAdBanner.tsx`** - Complete rewrite of ad loading mechanism

---

### Expected Outcome

After this fix:
- Adsterra `invoke.js` script will load successfully from `lozengehelped.com`
- Ad creatives will render in all placements (below-action, mid-page, above-footer)
- Impressions and clicks will be tracked in the Adsterra dashboard
- Revenue will be generated from ad views

---

### Mobile Consideration

The current 728x90 banner size will still be clipped on mobile screens. A follow-up improvement could add responsive ad sizes (300x250 or 320x50) for mobile devices, but the primary fix addresses the script loading issue first.
