

## Instant Logo Loading Across the App

### Problem
The logo image (`newton-logo-clean.png`) is imported as a Vite ES module from `src/assets/`. This means the browser can only start downloading it **after** the JavaScript bundle loads, parses, and executes -- causing a visible delay where the logo area appears empty.

### Solution
Move the logo reference to the `public/` folder and preload it in `index.html` so the browser starts fetching it **immediately** with the HTML, before any JavaScript runs.

### Changes

| File | Change |
|------|--------|
| `public/newton-logo-clean.png` | Copy the logo from `src/assets/` to `public/` so it has a stable, predictable URL |
| `index.html` | Add `<link rel="preload" as="image" href="/newton-logo-clean.png">` in the `<head>` |
| `src/components/Logo.tsx` | Replace the ES module import with a direct `/newton-logo-clean.png` path; set `fetchPriority="high"` and `decoding="sync"` for instant rendering |

### Why This Works
- **Preload link**: The browser starts downloading the image as soon as it parses the HTML `<head>`, before any JS loads
- **Static public path**: No Vite hashing means the preload URL matches the actual URL used by the `<img>` tag
- **`fetchPriority="high"`**: Tells the browser to prioritize this image over other resources
- **`decoding="sync"`**: Ensures the image is decoded synchronously so it paints immediately when available, with no flicker

### Technical Details

**index.html** -- add after the font preload:
```html
<link rel="preload" as="image" href="/newton-logo-clean.png">
```

**Logo.tsx** -- remove import, use static path:
```tsx
const LOGO_SRC = "/newton-logo-clean.png";
// Remove: import newtonLogo from "@/assets/newton-logo-clean.png";
// Use LOGO_SRC in <img src={LOGO_SRC} ...>
// Change decoding="async" to decoding="sync"
// Add fetchPriority="high"
```

