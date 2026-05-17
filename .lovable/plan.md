# NewtonAI Pitch Presentation — Build Plan

A standalone, full-screen, animated 18-slide web presentation at a new route `/pitch`, kept entirely separate from the existing app so nothing else is affected.

## Route & entry

- Add `/pitch` route in `src/App.tsx` (lazy-loaded). Bypasses `ProtectedRoute` and the global `MobileBottomNav`/Newton assistant by being its own full-screen page.
- New `src/pages/PitchPresentation.tsx` mounts the deck inside an `AnimatePresence` with keyboard + click navigation, the fixed bottom nav, and Plus Jakarta Sans loaded via `<link>` injected through `react-helmet-async`.
- Existing `/pitch-deck` route is untouched.

## File structure (all new — nothing existing is modified except `App.tsx`)

```text
src/
  pages/PitchPresentation.tsx          // route entry, state, keyboard/click nav, AnimatePresence
  pitch/
    constants/videoPaths.ts            // VIDEO_PATHS map, empty strings
    components/
      Logo.tsx                         // NewtonAI logomark (size variants)
      VideoPlayer.tsx                  // placeholder + real HTML5 player + custom controls
      BottomNav.tsx                    // fixed nav + progress bar
      SlideShell.tsx                   // 100vw x 100vh wrapper, logo, motion variants, dot-grid bg
      PulseMeterDemo.tsx               // Slide 6 interactive
      FlashcardDemo.tsx                // Slide 10 interactive
      QuizDemo.tsx                     // Slide 8 interactive
    slides/
      Slide01Hero.tsx ... Slide18CTA.tsx   // 18 files, one per slide
      index.ts                         // ordered array of slide components + titles
```

## Core behaviors

- **Navigation state** in `PitchPresentation.tsx`: `currentSlide`, `presenterMode`, `isFullscreen`.
- **Keyboard**: `ArrowRight`/`Space` next, `ArrowLeft` prev, `f` fullscreen toggle, `p` presenter mode, `Home`/`End`, digits `1-9` jump.
- **Click**: slide wrapper `onClick` checks `e.clientX` vs `innerWidth/2`. Every interactive element calls `e.stopPropagation()`.
- **Fullscreen**: attempt `requestFullscreen()` on first user gesture (browsers block on load); a small "Enter fullscreen" button appears in the nav if not active.
- **Transitions**: each slide wrapped in `motion.div` with `opacity 0→1`, `scale 0.97→1`, 350ms cubic-bezier(0.25,0.46,0.45,0.94). Internal stagger via parent `variants`.

## Design tokens (scoped inline to the pitch route, no global token changes)

- Dark bg `#0A1628`, light bg `#FFFFFF`, primary `#6366F1`, accent `#F59E0B`.
- Dot-grid: inline SVG `<pattern>` with `opacity 0.04` rendered inside `SlideShell` when `theme="dark"`.
- Plus Jakarta Sans loaded via Google Fonts `<link>` in the page head; applied via inline `style={{ fontFamily }}` on `SlideShell` to avoid touching global Tailwind config.

## Reusable components

- **`SlideShell`** props: `theme: "dark" | "light"`, `title: string`, `children`. Renders 100vw×100vh container, dot-grid, logo top-left, motion variants context, click-to-navigate handler passed from parent via context.
- **`VideoPlayer`** props: `src`, `toolName`, `toolIcon`, `caption`.
  - Empty `src` → polished gradient placeholder with icon, name, "Demo Video" pill, scanning-line animation.
  - With `src` → HTML5 `<video>` + custom controls (play/pause, seek, time, mute, fullscreen) using Lucide icons. All controls `stopPropagation`.
- **`BottomNav`** fixed 52px bar with progress bar, prev/next/counter, fullscreen + presenter toggles, current slide title. Dims under presenter mode.

## Slide content

All 18 slides built per the spec, copy verbatim. Tool slides (4–15) share the same two-row template via a small `ToolSlideLayout` helper inside `slides/` (top dark problem/solution + icon, bottom light video panel). Slides 6, 8, 10 additionally mount their interactive demo below the video.

- **Slide 16 Analytics**: stat cards + Recharts `BarChart` with gradient fill + dashed `ReferenceLine` at 50% + CSS-grid heatmap (5×6).
- **Slide 17 Pricing**: 3 cards, middle scaled `1.04` with `z-index`, "MOST POPULAR" amber badge.
- **Slide 18 CTA**: gradient bg, large logo, two CTA buttons, contact row, serif italic tagline.

## Dependencies

- `framer-motion`, `lucide-react`, `recharts`, `react-router-dom`, `react-helmet-async` — all already installed. No new packages.

## Out of scope

- No edits to existing slides, dashboards, sidebar, auth, or backend.
- No actual video files — `VIDEO_PATHS` ships as empty strings; placeholder renders everywhere.
- No tests for the pitch (visual-only presentation deck).

## QA checklist

After build: load `/pitch`, arrow through all 18 slides, verify no scrollbars, animations play, interactive demos on slides 6/8/10 work, dashboard chart renders, pricing middle card prominent, presenter mode hides nav, fullscreen toggle works.
