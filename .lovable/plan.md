
# Performance Optimization Plan

## Identified Issues

### 1. Redundant Database Calls on Dashboard Load
The dashboard (`Index.tsx`) makes **5+ separate database calls** on mount, many duplicated across components:
- `profiles.full_name` (line 167)
- `profiles.subscription_tier` (line 240)
- `profiles.onboarding_completed` (line 289)
- `supabase.auth.getUser()` called separately by `useUserRole`, `useAdminAccess`, `CreditsContext`, and `Index.tsx` itself
- `useFeatureUsage` (via `FloatingUpgradeBanner`) fetches usage data

Each of these triggers a separate network round-trip, blocking render.

**Fix:** Consolidate into a single `profiles` query fetching all needed fields at once, and cache the auth user so `getUser()` is not called 4+ times.

### 2. framer-motion Still in Sidebar and Upgrade Banner
Despite the architecture policy stating framer-motion was removed from high-frequency UI, `AppSidebar.tsx` wraps **every sidebar menu item** in `motion.button` with `whileHover` and `whileTap`, and uses `AnimatePresence` for the explore section. `FloatingUpgradeBanner` also uses framer-motion. These cause unnecessary JS overhead on every interaction.

**Fix:** Replace `motion.button` with plain `button` elements using CSS transitions. Replace `AnimatePresence` with CSS-based show/hide.

### 3. Multiple Auth State Listeners
At least 4 components independently call `supabase.auth.onAuthStateChange()`:
- `ProtectedRoute`
- `GuestTrialProvider`
- `useUserRole`
- `useAdminAccess`
- `Index.tsx`

Each creates a separate WebSocket subscription and triggers re-renders independently.

**Fix:** Keep only the essential listeners. `ProtectedRoute` already guards auth -- `Index.tsx` does not need its own listener. Combine `useUserRole` and `useAdminAccess` data fetching.

### 4. Index.tsx is a 2240-line Mega Component
This single file holds 40+ state variables and dozens of handler functions, all re-created on every render. Any state change (e.g., a video search) triggers the entire component tree to re-evaluate.

**Fix:** Extract handler functions with `useCallback` and memoize child components. Move video-related state into a custom hook. (Full refactor is too large for this pass, but targeted memoization will help.)

### 5. backdrop-blur on Always-Visible Elements
`TopStatsBar` uses `backdrop-blur-sm` on a sticky header that is always visible. Backdrop blur is one of the most expensive CSS operations, forcing GPU compositing on every scroll frame.

**Fix:** Remove `backdrop-blur-sm` from the sticky top bar and use a solid or semi-transparent background instead.

### 6. Confetti Animation Creates 50 framer-motion Nodes
`ConfettiCelebration` renders 50 individual `motion.div` elements with complex animations. While it's event-triggered, the framer-motion overhead for 50 concurrent animations is significant.

**Fix:** Replace with CSS keyframe animations for confetti pieces, eliminating 50 JS-driven animation loops.

### 7. ProcessingOverlay Always Mounts Video Element
The `ProcessingOverlay` is rendered in `AppLayout` even when not processing, and it keeps a video element mounted. Combined with `VideoPreloader`, there are potentially 2 invisible video elements consuming memory.

**Fix:** Only render the video element when `isVisible` is true (use conditional rendering for the heavy element).

---

## Implementation Steps

### Step 1: Consolidate Dashboard Database Queries
Merge the 3 separate `profiles` queries in `Index.tsx` (full_name, subscription_tier, onboarding_completed) into one query. Remove the duplicate auth listener in `Index.tsx` since `ProtectedRoute` already handles it.

**File:** `src/pages/Index.tsx`

### Step 2: Remove framer-motion from AppSidebar
Replace all `motion.button` elements with plain `button` elements. Replace `whileHover={{ x: 4 }}` with `hover:translate-x-1` CSS class. Replace `whileTap={{ scale: 0.98 }}` with `active:scale-[0.98]` CSS class. Replace `AnimatePresence` for explore section with CSS transitions.

**File:** `src/components/AppSidebar.tsx`

### Step 3: Remove framer-motion from FloatingUpgradeBanner
Replace `motion.div` with a regular `div` using CSS transitions for enter/exit.

**File:** `src/components/FloatingUpgradeBanner.tsx`

### Step 4: Replace Confetti framer-motion with CSS
Convert 50 `motion.div` confetti pieces to CSS keyframe animations.

**File:** `src/components/ConfettiCelebration.tsx`

### Step 5: Remove backdrop-blur from TopStatsBar
Replace `bg-background/80 backdrop-blur-sm` with `bg-background/95` (nearly opaque, no blur needed).

**File:** `src/components/TopStatsBar.tsx`

### Step 6: Optimize ProcessingOverlay Video Mounting
Only mount the video element when `isVisible` is true or was recently true (with a short unmount delay for exit animation).

**File:** `src/components/ProcessingOverlay.tsx`

### Step 7: Deduplicate Auth Listeners
Remove the redundant `supabase.auth.onAuthStateChange` from `Index.tsx` (lines 303-328) since `ProtectedRoute` already redirects unauthenticated users. Use `supabase.auth.getSession()` once on mount instead.

**File:** `src/pages/Index.tsx`

---

## Expected Impact
- **Dashboard load time:** ~40-60% fewer network requests on mount
- **Scroll performance:** Elimination of backdrop-blur jank on sticky header
- **Interaction responsiveness:** No framer-motion JS overhead on sidebar hover/tap (8+ items)
- **Memory usage:** Reduced by removing always-mounted video elements
- **Bundle efficiency:** Less framer-motion usage means tree-shaking can remove more
