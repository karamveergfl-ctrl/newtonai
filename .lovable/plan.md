
## Plan: Fix Native Ad Rendering with Iframe-Based Approach

### Problem Analysis
The current `NativeAdBanner` component injects Adsterra's `invoke.js` script directly into the React DOM. This approach fails because:
- React/Vite may sanitize or block external script execution
- The script expects a real browser document context
- DOM manipulation by external scripts can conflict with React's virtual DOM

### Solution: Iframe-Based Ad Rendering

Replace direct script injection with a self-contained iframe that uses `srcdoc` to create an isolated execution environment where Adsterra scripts run natively.

---

### File to Modify

**`src/components/NativeAdBanner.tsx`** - Complete rewrite

---

### New Component Architecture

```text
+---------------------------+
|    NativeAdBanner         |
|  (React Component)        |
+---------------------------+
        |
        v
+---------------------------+
|   Lazy Load Check         |
|  (IntersectionObserver)   |
+---------------------------+
        |
        v (when visible)
+---------------------------+
|   <iframe srcdoc="...">   |
|   - Isolated HTML doc     |
|   - Adsterra script       |
|   - Container div         |
+---------------------------+
        |
        v (on load failure)
+---------------------------+
|   Collapse to null        |
|   (No empty space)        |
+---------------------------+
```

---

### Implementation Details

#### 1. Iframe Structure with srcdoc

The iframe will load a complete HTML document via `srcdoc`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    #container-ZONE_ID { width: 100%; min-height: 1px; }
  </style>
</head>
<body>
  <script async data-cfasync="false" src="https://lozengehelped.com/ZONE_ID/invoke.js"></script>
  <div id="container-ZONE_ID"></div>
</body>
</html>
```

#### 2. Iframe Attributes

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `srcdoc` | HTML string | Self-contained ad document |
| `sandbox` | `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox` | Security + script execution |
| `width` | `100%` | Responsive |
| `style.border` | `none` | Clean appearance |
| `style.minHeight` | `250px` (mobile: `220px`) | Visible ad space |
| `style.background` | `transparent` | Blend with page |
| `scrolling` | `no` | No scrollbars |

#### 3. Lazy Loading (Preserved)

Keep the existing `useLazyAdLoad` hook:
- `below-action`: Load immediately
- `mid-page` and `above-footer`: Load when within 300px of viewport

#### 4. Fail-Safe Behavior

- Add `onError` handler to iframe
- If iframe fails to load or times out (5 seconds), collapse the container entirely
- Track ad visibility via iframe height detection (if ad loads, container expands)
- Never show empty placeholder or "loading" states

#### 5. Suppression Rules (Preserved)

Keep existing logic:
- Hide for premium users (`isPremium`)
- Hide during deep study mode (`isInDeepStudy`)

---

### Component Props (Unchanged)

```tsx
interface NativeAdBannerProps {
  placement: "below-action" | "mid-page" | "above-footer";
  className?: string;
}
```

---

### Styling Updates

| Property | Value |
|----------|-------|
| Container padding | `py-4 md:py-6` (slightly reduced) |
| Container margin | `my-6 md:my-8` |
| Background | `bg-background` |
| Border radius | `rounded-xl` |
| "Sponsored" label | Keep subtle 10px uppercase label |
| Iframe min-height | Desktop: `280px`, Mobile: `220px` |

---

### Files Changed

Only **1 file** needs modification:

1. `src/components/NativeAdBanner.tsx` - Replace script injection with iframe approach

---

### What This Preserves

- Single ad unit (zone ID `784f975abdd60c86610b3cf2654a25b5`)
- Lazy loading for mid-page and footer
- Premium user suppression
- Deep study mode suppression
- Max 3 ads per page
- `useCanShowMidPageAd` hook for height checks
- All existing page integrations (no changes needed to other files)

---

### Expected Outcome

After this change:
- Adsterra scripts execute in a proper browser context inside the iframe
- Ads display reliably when inventory is available
- Failed ad loads collapse gracefully (no empty space)
- Mobile-responsive behavior maintained
- No conflicts with React's DOM management
