

## Fix Lag and Slow Page Loading

### Root Causes Identified

1. **Infinite framer-motion animation running constantly**: The `GamificationBadge` component (visible on every authenticated page via `TopStatsBar`) has a flame icon with an infinite `scale + y` animation that continuously updates `transform: scale()` on every frame. The session replay confirms rapid, non-stop DOM updates from this animation.

2. **1-second polling interval in GamificationBadge**: A `setInterval` runs every 1 second to check localStorage for XP changes, causing unnecessary re-renders on every tick. Combined with the infinite animation, this creates constant main-thread work.

3. **framer-motion on admin Analytics page**: The Analytics page uses `motion.div` for stat cards (entrance animations), pulling the heavy framer-motion library into a critical page.

4. **TopStatsBar separator has `animate-pulse`**: A small CSS `animate-pulse` on a border separator adds minor continuous work.

### Fixes

#### 1. `src/components/GamificationBadge.tsx` -- Remove infinite animation and polling

- **Replace the infinite `motion.div` animation** on the Flame icon (lines 229-241) with a simple static `<Flame>` icon. The bounce/scale animation runs on every frame and is the primary source of lag.
- **Remove the 1-second `setInterval`** polling (line 120). Instead, only listen for the `storage` event, which fires when another tab updates localStorage. For same-tab XP updates, dispatch a custom event (`xp-update`) from wherever XP is awarded.
- Remove `framer-motion` import from this component entirely.

#### 2. `src/components/TopStatsBar.tsx` -- Remove animate-pulse

- Remove `animate-pulse` from the separator div (line 19). Replace with a static style.

#### 3. `src/pages/admin/Analytics.tsx` -- Replace motion.div with CSS

- Replace `motion.div` stat card wrapper with a plain `div` using CSS `animate-in fade-in` for the entrance effect. This eliminates the framer-motion dependency from this page.

#### 4. `src/components/AnimatedCreditCounter.tsx` -- Optimize scale animation

- The `animate` prop with `scale: [1, 1.1, 1]` re-triggers correctly only on credit changes, so this is fine. No changes needed here.

### Technical Details

| File | Change |
|------|--------|
| `src/components/GamificationBadge.tsx` | Remove infinite `motion.div` animation on Flame icon; replace with static icon. Remove 1-second `setInterval` polling; keep `storage` event listener only. Remove `framer-motion` import. |
| `src/components/TopStatsBar.tsx` | Remove `animate-pulse` from separator div on line 19 |
| `src/pages/admin/Analytics.tsx` | Replace `motion.div` stat cards with plain `div` + CSS `animate-in fade-in` classes. Remove `framer-motion` import. |

### Expected Impact

- Eliminates the continuous `transform: scale()` DOM updates visible in the session replay
- Removes 1-second polling interval that causes unnecessary re-renders
- Reduces main-thread work significantly on all authenticated pages
- Faster page interactions and reduced input delay

