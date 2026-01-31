
# Plan: Add Adsterra Banner Script to Header

## Overview

Add the Adsterra 300x250 banner ad script directly to the `index.html` header, alongside the existing Ezmob and Nap5k global ad scripts.

## Changes

### File: `index.html`

Add the Adsterra script after the Nap5k ad (after line 27):

```html
<!-- Adsterra Banner Ad (Zone: f68fadee12d992a26443bfb050da5b07) -->
<script>
  atOptions = {
    'key' : 'f68fadee12d992a26443bfb050da5b07',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script src="https://lozengehelped.com/f68fadee12d992a26443bfb050da5b07/invoke.js"></script>
```

## Result

The `<head>` section will contain:
1. Google Analytics (existing)
2. Ezmob Vignette Ad - Zone 10543352 (existing)
3. Nap5k Ad - Zone 10548751 (existing)
4. **Adsterra Banner Ad** (new)
5. Meta tags and other content (existing)

## Technical Note

Unlike the component-based `AdsterraBanner.tsx` which uses scroll-triggered lazy loading and premium suppression, this global header script will:
- Load on every page immediately
- Not be suppressed for premium users
- Not respect deep study mode

This is the same behavior as the existing Ezmob and Nap5k global scripts. The component version created earlier still exists for controlled placement within tool pages.
