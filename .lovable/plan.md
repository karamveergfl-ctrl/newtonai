

# Plan: Add Vignette Ad Script to Header

## Overview

Add the Ezmob vignette ad script (zone 10543352) to the `index.html` header for additional ad revenue.

## Important Considerations

**Vignette ads behave differently from banner ads:**
- They are full-screen interstitial ads that appear over your content
- They load globally on ALL pages
- They show to ALL users (including premium subscribers)
- They are not controlled by the 50% scroll trigger

**Recommendation**: Consider implementing a React-based loader instead of putting it directly in the header, so you can:
- Exclude premium users from seeing vignettes
- Control when vignettes appear (e.g., only on specific pages)
- Respect the "deep study" mode suppression

---

## Option A: Simple Header Implementation (Requested)

Add the script directly to `index.html` - quick but shows to everyone.

### File to Modify

**`index.html`**

Add the vignette script after the Google Analytics tag:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-W67PH05SLY"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-W67PH05SLY');
</script>

<!-- Ezmob Vignette Ad (Zone: 10543352) -->
<script>
  (function(s){
    s.dataset.zone='10543352';
    s.src='https://gizokraijaw.net/vignette.min.js';
  })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
</script>
```

---

## Option B: Controlled React Implementation (Recommended)

Create a component that conditionally loads the vignette script based on user status.

### Files to Create

**`src/components/VignetteAdLoader.tsx`**

```typescript
// Only loads vignette script for non-premium users
// Respects deep study mode
// Can be placed in App.tsx to control globally
```

### Files to Modify

**`src/App.tsx`**

Add the VignetteAdLoader component inside the providers.

---

## Recommendation

I recommend **Option B** for consistency with your existing ad strategy (premium exclusion, study mode suppression). However, if you want the quick implementation, Option A will work immediately.

---

## File Summary

| Option | File | Action | Notes |
|--------|------|--------|-------|
| A | `index.html` | Modify | Add script to head - shows to all users |
| B | `src/components/VignetteAdLoader.tsx` | Create | Conditional loading component |
| B | `src/App.tsx` | Modify | Add loader component |

Which option would you like me to implement?

