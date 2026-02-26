
# Fix PDF/PPTX Export to Match On-Screen Presentation Exactly

## Problems Identified

1. **Animations not complete during capture**: Slide elements use `animate-fade-in` with delays up to 750ms, but capture only waits 700ms -- so cards/text may be invisible or partially faded in
2. **Visible flickering**: The export cycles through slides on the actual screen using `setCurrent`, causing the user to see rapid slide changes
3. **Viewport-dependent sizing**: Slides are `absolute inset-0` (full viewport), so the capture size varies with browser window size instead of being a consistent 1280x720
4. **Progress bar and controls captured**: The capture targets `[data-slide-index]` which is the slide itself, but the overall quality depends on viewport state

## Solution

Replace the `captureAllSlides` function with an **off-screen rendering approach** that:

1. Creates a hidden container (`position: fixed; left: -9999px`) at exactly **1280x720**
2. For each slide, clones the slide's rendered DOM into the container with **all animations removed** (forces `opacity: 1`, `transform: none`, removes `animate-fade-in` class)
3. Captures each clone with `html2canvas` at 2x scale
4. Cleans up -- the user never sees any flickering

This ensures every card, icon, and gradient is fully visible and the output is always 1280x720 regardless of viewport.

## Technical Changes

### File: `src/pages/PitchDeck.tsx`

**Replace `captureAllSlides` function** with a new approach:
- Instead of changing `setCurrent` and waiting, render ALL slides simultaneously in a hidden off-screen container
- Each slide is rendered in a 1280x720 div with the same background gradient
- Force all child elements to be fully visible (override `animate-fade-in` opacity/transform, override any `opacity: 0` or `translateY` inline styles)
- Capture each slide container sequentially with `html2canvas`
- No state changes needed -- no flickering, no animation timing issues

**Key details:**
- The off-screen container gets inline styles to strip all animations: inject a `<style>` tag that sets `* { animation: none !important; opacity: 1 !important; transition: none !important; }` scoped to the container
- Each slide component is rendered via `ReactDOM.createRoot` into the off-screen divs, OR simpler: just render all 8 slides always in the DOM (hidden) and capture them
- **Simplest approach**: Render all slides in a hidden container within the component (always mounted but off-screen), and capture those divs directly. This avoids needing ReactDOM.createRoot or cloning.

**Implementation:**
1. Add a hidden container that always renders all 8 slides at 1280x720 (off-screen, `position: fixed; left: -9999px; top: 0`)
2. Each slide wrapper in this container has a `data-export-slide` attribute and forces no animations via a CSS class
3. `captureAllSlides` simply queries these pre-rendered slides and captures them -- no slide switching needed
4. Add a CSS class `.export-slide-container *` that overrides `animation-delay`, `animation`, `opacity`, and `transform` to ensure everything is visible

**No changes needed to `generatePDFFromImages` or `generatePPTXFromImages`** -- they already work correctly with the image array.

### Summary of changes:
| What | How |
|------|-----|
| Fix invisible/faded elements | Force `animation: none; opacity: 1` on export slides |
| Fix flickering during export | Render slides off-screen instead of cycling on-screen |
| Fix inconsistent sizing | Fixed 1280x720 container regardless of viewport |
| No behavior change | PDF and PPTX buttons work the same way, just produce correct output |
