

## Fix App-Wide Lag and Loading Performance

### Problems Found

1. **GamificationBadge useEffect has `xp` in its dependency array** (line 123), which means every time XP state updates, the entire effect re-runs -- re-reading localStorage, re-calculating streak, and re-attaching event listeners. This creates a cascading re-render loop.

2. **FloatingToolsShowcase auto-rotates every 4 seconds** with `setInterval`, causing re-renders on the landing page and auth page even when off-screen. The `key={selectedTool}` on the inner content forces unnecessary DOM teardown/rebuild on each tick.

3. **Header badge `animate-pulse`** classes (lines 123, 156, 218) -- three instances of infinite CSS animation on "NEW" badges in the navigation. These run continuously on every page.

4. **CreditBalance checks auth on every mount** by calling `supabase.auth.getSession()` and subscribing to `onAuthStateChange` -- duplicating what GuestTrialContext already does.

5. **GuestTrialContext and CreditBalance both subscribe to `onAuthStateChange`** independently, creating redundant auth listeners.

6. **PageTransition wraps every route** with `animate-in fade-in duration-200`, adding animation overhead to every navigation.

---

### Fixes

#### 1. Fix GamificationBadge infinite re-render loop
**File:** `src/components/GamificationBadge.tsx`

- Remove `xp` from the useEffect dependency array (change `[xp]` to `[]`). The effect only needs to run once on mount.
- Use a ref to track the current XP value inside the event handler instead of relying on the stale closure over `xp`.
- Move the achievements array outside the component (it's recreated on every render since it depends on state -- memoize it with `useMemo`).

#### 2. Remove auto-rotate interval from FloatingToolsShowcase
**File:** `src/components/FloatingToolsShowcase.tsx`

- Remove the 4-second `setInterval` auto-rotation (lines 82-87). Users can still click tool badges to switch. This eliminates a re-render every 4 seconds on the landing page.
- Remove the `key={selectedTool}` from the inner indicator div to prevent forced DOM teardown.

#### 3. Remove `animate-pulse` from Header navigation badges
**File:** `src/components/Header.tsx`

- Remove `animate-pulse` from the three "NEW" badge instances (lines 123, 156, 218). Replace with a static style. These infinite CSS animations run on every page where the Header is rendered.

#### 4. Simplify PageTransition to zero-cost wrapper
**File:** `src/components/PageTransition.tsx`

- Remove the `animate-in fade-in duration-200` class. This CSS animation fires on every route change and adds layout work. Replace with a simple static wrapper.

#### 5. Remove redundant auth check in CreditBalance
**File:** `src/components/CreditBalance.tsx`

- The `useCredits` hook already handles auth state. Remove the duplicate `supabase.auth.getSession()` call and `onAuthStateChange` subscription. Use the existing `loading` state from `useCredits` to determine if the component should render.

---

### Technical Details

| File | Change | Impact |
|------|--------|--------|
| `src/components/GamificationBadge.tsx` | Fix `useEffect` deps from `[xp]` to `[]`; use ref for XP tracking; memoize achievements | Eliminates cascading re-render loop |
| `src/components/FloatingToolsShowcase.tsx` | Remove auto-rotate `setInterval`; remove `key={selectedTool}` | Eliminates landing page re-renders every 4s |
| `src/components/Header.tsx` | Remove `animate-pulse` from 3 badge instances | Stops 3 infinite CSS animations on every page |
| `src/components/PageTransition.tsx` | Remove `animate-in fade-in` class | Eliminates animation work on every navigation |
| `src/components/CreditBalance.tsx` | Remove duplicate auth check and `onAuthStateChange` listener | Reduces redundant async calls and listeners |

### Expected Impact
- Eliminates the re-render loop that was the primary source of jank
- Removes 4+ continuous animations/intervals running on every page
- Reduces redundant auth listeners
- Pages should feel instant on navigation with no fade-in delay

