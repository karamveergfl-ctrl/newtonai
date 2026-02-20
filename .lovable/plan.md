

## Mobile UI/UX Analysis and Fixes

### Issues Found

**1. Newton Assistant Button Overlaps Sticky CTA Bar (Landing Page)**
On the landing page, when scrolled past the hero, the sticky "Get Started Free" CTA bar appears at the bottom. The Newton assistant trigger button (`fixed bottom-4 right-4`) sits directly on top of it, making the CTA partially blocked.

**Fix:** When the sticky CTA bar is visible on mobile, move the Newton button up by adding `bottom-16` instead of `bottom-4` on landing-page routes, or give the CTA bar enough right padding so the button doesn't overlap. The cleanest fix: on the landing page (where the CTA bar is used), hide the Newton trigger button entirely since the user hasn't signed in yet and the Newton assistant requires auth anyway.

**File:** `src/components/GlobalNewtonAssistant.tsx` (line 106)
- Check if the current path is `/` and hide the trigger button on the landing page, since it requires authentication and the landing page already has CTAs.

**2. Newton Button Overlaps Footer Social Icons**
At the bottom of every page, the floating Newton button covers the social media icons in the footer.

**Fix:** Add `pb-16` (bottom padding) to the footer's social icons row so there's clearance, or move the Newton button higher when footer is in view. Since the button floats above all content, the simplest fix is adding bottom padding to the footer.

**File:** `src/components/Footer.tsx` (near the social icons section)
- Add `pb-16 md:pb-0` to the bottom of the footer so mobile users can tap the social icons.

**3. White Flash on Route Navigation (Suspense Fallback)**
The `Suspense` fallback in `App.tsx` is `<div />` -- an empty div. On mobile, when lazy-loaded routes are being fetched, users see a blank white screen for 1-3 seconds, which is jarring on the dark theme.

**Fix:** Replace the empty `<div />` with a minimal centered spinner that respects the dark theme.

**File:** `src/App.tsx` (line 111)
- Replace `<div />` with a themed loading spinner:
```
<div className="min-h-screen flex items-center justify-center bg-background">
  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
</div>
```

**4. Landing Page "Ctrl+V / Cmd+V" Tip Shows on Mobile (Homework Helper)**
The Homework Helper page shows "Tip: Paste an image directly with Ctrl+V / Cmd+V" which is a desktop-only shortcut and irrelevant on mobile. This wastes vertical space.

**Fix:** Hide this tip on mobile viewports.

**File:** The component rendering the Homework Helper header tip needs a `hidden md:block` class on the tip text.

---

### Summary Table

| Issue | Severity | File(s) | Fix |
|-------|----------|---------|-----|
| Newton button overlaps sticky CTA on landing page | High | `GlobalNewtonAssistant.tsx` | Hide button on `/` route (requires auth anyway) |
| Newton button overlaps footer social icons | Medium | `Footer.tsx` | Add `pb-16 md:pb-0` to footer bottom |
| White flash on navigation (empty Suspense fallback) | Medium | `App.tsx` | Add themed spinner fallback |
| Desktop-only "Ctrl+V" tip visible on mobile | Low | Homework Helper component | Add `hidden md:block` |

