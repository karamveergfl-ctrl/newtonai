

## Plan: Replace Native Banner with Iframe Banner Ad

### Overview

Replace the current Adsterra native banner configuration with the new iframe banner format (728x90 leaderboard) while maintaining all existing functionality.

---

### Changes Required

**File: `src/components/NativeAdBanner.tsx`**

Update the ad configuration and HTML generation:

#### Current Configuration
```tsx
const ADSTERRA_SCRIPT_URL = "https://lozengehelped.com/i197tx31?key=79db3d2bc07f614676ed1e5d73f914c5";
const ADSTERRA_CONTAINER_ID = "i197tx31";
```

#### New Configuration
```tsx
const ADSTERRA_KEY = "c5d398ab0a723a7cfa61f3c2d7960602";
const ADSTERRA_SCRIPT_URL = `https://lozengehelped.com/${ADSTERRA_KEY}/invoke.js`;
const AD_WIDTH = 728;
const AD_HEIGHT = 90;
```

#### Updated HTML Generation

The `generateAdHtml` function will be updated to include the `atOptions` configuration:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%;
      background: transparent; 
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <script>
    atOptions = {
      'key' : 'c5d398ab0a723a7cfa61f3c2d7960602',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script src="https://lozengehelped.com/c5d398ab0a723a7cfa61f3c2d7960602/invoke.js"></script>
</body>
</html>
```

#### Styling Updates

Since this is a fixed-size banner (728x90), adjust the iframe container:

| Property | Desktop | Mobile |
|----------|---------|--------|
| Min Height | `90px` | `90px` |
| Max Width | `728px` | `100%` (responsive) |
| Centering | Flex center | Flex center |

---

### What Stays the Same

- Lazy loading for mid-page and footer placements
- Premium user suppression (`isPremium`)
- Deep study mode suppression (`isInDeepStudy`)
- Fail-safe timeout (5 seconds)
- `useCanShowMidPageAd` hook
- All page integrations

---

### Mobile Responsiveness Note

The 728x90 banner is a standard desktop leaderboard size. On mobile devices narrower than 728px, the ad may:
- Scale down proportionally
- Or Adsterra may serve a mobile-optimized creative

The iframe will be centered and constrained to `max-width: 100%` to handle this gracefully.

