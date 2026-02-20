

## Mobile Bottom Navigation Bar

### Overview
Add a persistent bottom navigation bar on mobile devices that provides quick access to the 5 most important sections of the app. This replaces the current sidebar-based navigation on mobile with a native app-like experience, matching the patterns shown in the reference images.

### Navigation Items
1. **Home** - Navigate to `/dashboard`
2. **Snap** - Navigate to `/tools/homework-help` (camera/image-based problem solving)
3. **Newton** - Open the Newton AI chat assistant
4. **Tools** - Navigate to `/tools` (all study tools)
5. **Profile** - Navigate to `/profile`

### How It Works
- The bottom bar appears only on mobile devices (below 768px width)
- It is visible on all authenticated pages (dashboard, tool pages, profile)
- It is hidden on public pages (landing page, auth, pricing, about, etc.)
- The currently active tab is highlighted with the primary color
- The Newton (center) button has a slightly larger, emphasized design -- matching the "snap" style in the reference images
- Content areas get bottom padding (`pb-16`) so nothing is hidden behind the bar

### What Changes

**New file: `src/components/MobileBottomNav.tsx`**
- A fixed-bottom navigation bar component with 5 icon+label buttons
- Uses `useIsMobile()` hook to only render on mobile
- Uses `useLocation()` to highlight the active route
- The center "Newton" button triggers the Newton assistant (via a callback) instead of navigating
- Icons: `Home`, `Camera`, `MessageCircle` (Newton), `Grid3X3` (Tools), `User` (Profile)
- Styled with `bg-background/95 backdrop-blur-sm border-t` for a clean floating look
- Hidden on landing page (`/`), auth page (`/auth`), and other public routes

**Modified: `src/components/AppLayout.tsx`**
- Import and render `MobileBottomNav` inside the layout
- Add `pb-16 md:pb-0` to the main scrollable content area on mobile so content isn't obscured by the bottom bar

**Modified: `src/components/GlobalNewtonAssistant.tsx`**
- Remove the floating Newton trigger button on mobile entirely (the bottom nav replaces it)
- Expose a way for the bottom nav to open the Newton chat (via a shared state or callback)

**Modified: `src/components/Footer.tsx`**
- The existing `pb-16` fix remains, which provides clearance above the bottom nav

### Technical Details

The `MobileBottomNav` component will:
- Use `position: fixed; bottom: 0` with `z-index: 50`
- Apply safe-area-inset-bottom padding for devices with home indicators (notched phones)
- Each button uses a 44x44px minimum touch target
- Route matching uses `startsWith` for nested tool routes (e.g., `/tools/quiz` highlights "Tools")
- The Newton button in the center will be visually distinct (larger icon, primary background circle)

The bottom nav is hidden during:
- Full-screen study tools (quiz mode, flashcard review)
- Landing page, auth, onboarding
- Any page that uses `showSidebar={false}` in AppLayout

### Visual Layout

```text
+------+------+--------+------+--------+
| Home | Snap | Newton | Tools| Profile|
|  []  |  []  |  (*)   |  []  |   []   |
+------+------+--------+------+--------+
```

The center Newton button gets an elevated circular background to make it stand out as the primary action, similar to the "Snap" button in the reference image.
