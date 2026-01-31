
## Plan: Fix Adsterra Ads - Revert to srcDoc Iframe Approach

### Problem Identified

The recent change from `srcDoc` iframe to direct script injection broke the Adsterra ads. The Adsterra dashboard shows the ads **were working** on previous days (01/27-01/30) but stopped working after the change.

**Why direct script injection fails:**
- All three ad placements (`below-action`, `mid-page`, `above-footer`) set the same global `atOptions` variable
- When components mount simultaneously, they overwrite each other's configuration
- Only one ad (or none) loads properly
- Console shows: `Adsterra ad failed to load for placement: below-action/mid-page/above-footer`

**Why `srcDoc` iframes work:**
- Each iframe has its **own isolated `window` object**
- `atOptions` in iframe A ≠ `atOptions` in iframe B
- No global variable conflicts
- All ads can load simultaneously without race conditions

---

### Solution

Revert `NativeAdBanner.tsx` to use the `srcDoc` iframe approach, which provides complete JavaScript isolation for each ad placement.

---

### File Changes

**File: `src/components/NativeAdBanner.tsx`**

Replace the direct script injection with `srcDoc` iframe approach:

1. **Remove the direct script injection `useEffect`** (lines 67-106)
2. **Add a `generateAdHtml()` function** that creates a complete HTML document with:
   - Proper DOCTYPE and HTML structure
   - The `atOptions` configuration script
   - The `invoke.js` script from Adsterra's CDN
3. **Use an `<iframe srcDoc={...}>` element** instead of a div with injected scripts
4. **Keep existing lazy loading and premium suppression logic**

---

### Implementation Details

The new `generateAdHtml()` function will create:

```text
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; min-height: 100%; }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key': 'c5d398ab0a723a7cfa61f3c2d7960602',
      'format': 'iframe',
      'height': 90,
      'width': 728,
      'params': {}
    };
  </script>
  <script src="//lozengehelped.com/c5d398ab0a723a7cfa61f3c2d7960602/invoke.js"></script>
</body>
</html>
```

The iframe will be rendered with:
- Fixed dimensions (728×90)
- `scrolling="no"` to prevent scrollbars
- `frameBorder="0"` for clean appearance
- Proper `title` for accessibility

---

### Technical Comparison

| Aspect | Direct Injection (Broken) | srcDoc Iframe (Fix) |
|--------|---------------------------|---------------------|
| JavaScript context | Main window | Isolated per iframe |
| `atOptions` scope | Global (conflicts) | Per-iframe (isolated) |
| Multiple ads | Only 1 loads | All load correctly |
| Cross-origin scripts | May be blocked | Works in iframe |

---

### Files Modified

1. **`src/components/NativeAdBanner.tsx`** - Replace script injection with srcDoc iframe

---

### Expected Outcome

After this fix:
- All three ad placements will render correctly
- Each ad loads in its own isolated JavaScript environment
- No global variable conflicts
- Impressions and clicks will continue to be tracked in Adsterra dashboard
- The fix aligns with the recommended approach from Adsterra integration guides
