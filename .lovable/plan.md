

## Mobile UI Improvements: Tools Grid, Header Branding, and Newton Full-Screen

### 1. Redesign the Tools Page for Quick Access (Mobile-First Grid)

The current `/tools` page is a public marketing page with large cards, hero sections, and CTAs. When accessed from the bottom nav, authenticated users need a compact, quick-access grid instead.

**Changes to `src/pages/Tools.tsx`:**
- Detect if user is authenticated; if so, show a compact grid layout instead of the marketing page
- Display tools in a 2-column grid of icon + label cards (similar to app launchers)
- Each card: rounded icon container with color, tool name below, single tap to navigate
- Remove hero section, feature lists, and CTA for authenticated users
- Wrap authenticated view in `AppLayout` so bottom nav is visible
- Keep the public marketing page for unauthenticated visitors

The compact grid will look like:
```text
+----------+----------+
|  [Quiz]  | [Flash]  |
+----------+----------+
| [Podcast]| [MindMap]|
+----------+----------+
| [Notes]  |[Summary] |
+----------+----------+
| [HW Help]| [PDF Chat]|
+----------+----------+
```

### 2. Add Logo + "NewtonAI" to the Left Side of the Header

**Changes to `src/components/TopStatsBar.tsx`:**
- Add the Logo component (xs size) with `showText={true}` on the left side of the header
- Move the `GamificationBadge` (XP + streak) to the right side
- Layout: `[Logo NewtonAI]  ---- [192 XP fire 4]`
- On mobile, the logo appears on the left and the XP badge on the right, giving a proper branded header

### 3. Move Progress/XP Badge to the Right Side

**Changes to `src/components/TopStatsBar.tsx`:**
- The `GamificationBadge` currently sits on the left next to the sidebar trigger
- Move it to the right side of the header bar
- On mobile, the right-side pill (theme + profile) is already hidden, so the XP badge becomes the sole right-side element

### 4. Newton Chat Launches Full-Screen on Mobile

**Changes to `src/components/GlobalNewtonAssistant.tsx`:**
- Currently Newton opens in an 85vh drawer on mobile
- Change to full-screen: set drawer height to `h-[100dvh]` or use a full-screen overlay instead of a drawer
- This gives maximum space for the chat interface on mobile

### Summary of File Changes

| File | Change |
|------|--------|
| `src/components/TopStatsBar.tsx` | Add Logo (xs, showText) on left; move GamificationBadge to right side |
| `src/pages/Tools.tsx` | Add compact 2-column grid for authenticated users; wrap in AppLayout |
| `src/components/GlobalNewtonAssistant.tsx` | Change mobile drawer from 85vh to full-screen (100dvh) |

### Technical Details

**TopStatsBar.tsx:**
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <SidebarTrigger className="hidden md:flex h-8 w-8" />
    <Logo size="xs" showText compact />
  </div>
  <div className="flex items-center gap-2">
    <GamificationBadge />
    <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-full px-1 py-1">
      <ThemeToggle />
      <Button ...profile... />
    </div>
  </div>
</div>
```

**Tools.tsx (authenticated view):**
- Check auth state with `supabase.auth.getSession()`
- If authenticated, render compact grid wrapped in `AppLayout`
- Each tool card: `aspect-square rounded-2xl` with icon and label
- Include PDF Chat as an additional tool option
- Add a simple "Study Tools" header at the top

**GlobalNewtonAssistant.tsx:**
- Change `h-[85vh] max-h-[85vh]` to `h-[100dvh] max-h-[100dvh]`
- This makes Newton fill the entire screen on mobile for a true full-screen chat experience

