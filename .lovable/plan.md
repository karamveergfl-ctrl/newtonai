

## Instant Page Navigation via Route Prefetching

### Problem
All pages use `React.lazy()`, so clicking any link triggers a chunk download before the page renders, causing a ~3-second delay.

### Solution
Create a centralized prefetch utility and prefetch all route chunks in the background during browser idle time. Additionally, add hover-based prefetching on links in the FloatingToolsShowcase for immediate responsiveness.

### Changes

**1. New file: `src/lib/prefetchRoutes.ts`**

A route-to-import map covering all lazy-loaded pages. Provides:
- `prefetchRoute(path)` -- prefetch a single route's chunk (called on hover)
- `prefetchAllRoutes()` -- prefetch all routes during idle time

The map will include every lazy route from App.tsx (~40 routes): tool pages, compare pages, SEO pages, content pages, admin pages, etc.

**2. Update: `src/App.tsx`**

- Import `prefetchAllRoutes` and call it inside `AnimatedRoutes` using a `useEffect` with `requestIdleCallback` (fallback to `setTimeout`). This starts background prefetching once the initial page has rendered.

**3. Update: `src/components/FloatingToolsShowcase.tsx`**

- Import `prefetchRoute` and add `onMouseEnter={() => prefetchRoute(tool.route)}` to each tool badge `<Link>`. This ensures hovering starts the download immediately even if idle prefetch hasn't completed yet.

### How It Works

1. User lands on any page -- after initial render, `requestIdleCallback` fires and begins downloading all route chunks in the background
2. If user hovers a tool badge before idle prefetch completes, that specific chunk is prioritized
3. By click time, the chunk is cached -- navigation is instant
4. Dynamic `import()` calls are cached by the browser/bundler, so duplicate calls are no-ops

### Technical Details

| File | Change |
|------|--------|
| `src/lib/prefetchRoutes.ts` | New file with route-to-import map and prefetch functions |
| `src/App.tsx` | Call `prefetchAllRoutes()` via `requestIdleCallback` in `AnimatedRoutes` |
| `src/components/FloatingToolsShowcase.tsx` | Add `onMouseEnter` prefetch to tool badge links |

