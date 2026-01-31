
# Plan: Add Nap5k Ad Script to Header

## Overview

Add a new ad network script (Zone ID: 10548751) from nap5k.com to the `index.html` header, alongside the existing Ezmob vignette ad.

## Changes

### File: `index.html`

Add the new ad script after the existing Ezmob vignette ad (after line 19):

```html
<!-- Nap5k Ad (Zone: 10548751) -->
<script>
  (function(s){
    s.dataset.zone='10548751';
    s.src='https://nap5k.com/tag.min.js';
  })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
</script>
```

## Result

The `<head>` section will contain:
1. Google Analytics (existing)
2. Ezmob Vignette Ad - Zone 10543352 (existing)
3. **Nap5k Ad - Zone 10548751** (new)
4. Meta tags and other content (existing)

## Technical Note

This script follows the same pattern as the existing Ezmob vignette: it dynamically creates a script element and loads the ad tag globally on every page.
