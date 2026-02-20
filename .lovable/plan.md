

## Smooth Mobile Scrolling for Low-End Devices

### Problem
On low-end mobile devices with slow processors, scrolling can feel janky because the browser struggles to composite layers and repaint during scroll events.

### Solution
Apply mobile-only CSS optimizations that leverage GPU-accelerated scrolling and reduce paint/layout work during scroll. These are purely CSS changes that won't affect desktop behavior.

### Changes

**File: `src/index.css`** -- Add a mobile-only media query block with these optimizations:

1. **`-webkit-overflow-scrolling: touch`** -- Enables momentum (inertial) scrolling on older iOS Safari, making scroll feel native and fluid.

2. **`scroll-behavior: smooth`** -- Enables smooth programmatic scrolling (e.g., scroll-to-top) on mobile only. Not applied to desktop to keep instant scroll behavior there.

3. **`will-change: scroll-position`** on the main scrollable container -- Hints to the browser to promote the scroll container to its own compositing layer, reducing repaints.

4. **`content-visibility: auto`** on heavy content sections -- Allows the browser to skip rendering off-screen content entirely, dramatically reducing layout/paint cost on low-end devices.

5. **`contain: layout style paint`** on cards and repeated elements -- Tells the browser that layout changes inside these elements don't affect siblings, reducing recalculation scope during scroll.

**File: `src/components/AppLayout.tsx`** -- Add a CSS class `mobile-scroll-container` to the `ScrollableContent` div so the CSS optimizations target it specifically.

### What This Fixes
- Janky/stuttering scroll on budget Android phones
- Scroll lag when many cards or images are on screen
- Unnecessary off-screen rendering that wastes CPU/GPU on low-end devices

### Technical Details

```css
/* Mobile-only scroll optimizations (index.css) */
@media (max-width: 767px) {
  .mobile-scroll-container {
    -webkit-overflow-scrolling: touch;
    will-change: scroll-position;
    scroll-behavior: smooth;
  }

  /* Skip rendering off-screen content */
  .mobile-scroll-container > div > section,
  .mobile-scroll-container > div > div {
    content-visibility: auto;
    contain-intrinsic-size: auto 500px;
  }
}
```

```tsx
// AppLayout.tsx - ScrollableContent div
<div 
  className="flex-1 flex flex-col overflow-auto min-h-0 mobile-scroll-container"
  onScroll={handleScroll}
>
```

No JavaScript changes beyond adding a CSS class name. All optimizations are pure CSS, zero runtime cost.

