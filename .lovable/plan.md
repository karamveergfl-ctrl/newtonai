
# Plan: Extend SmartBanner to Landing Pages and Fix Empty Container Issue

## Overview

This plan addresses two requirements:
1. **Fix**: Ensure ad containers and "SPONSORED" label only appear when an actual ad loads
2. **Extend**: Add SmartBanner placements to landing page, blog, compare pages, and other content pages

## Part 1: Fix SmartBanner Empty Container Issue

### File: `src/components/SmartBanner.tsx`

**Current Problem:**
- Loading skeleton shows for Placement A (lines 160-163)
- Container can render before ad confirmation
- "Sponsored" label may show prematurely

**Solution:**

1. **Add iframe content confirmation state**
   - New state: `isAdConfirmed` to track successful iframe load
   - Use `onLoad` event on iframe to confirm content

2. **Add 2500ms timeout safety**
   - Start timer when `adHtml` is set
   - If iframe doesn't load within timeout, collapse entirely

3. **Remove loading skeleton**
   - Delete lines 160-163 (the skeleton div)
   - No height reservation before ad loads

4. **Defer all rendering until confirmed**
   - Only show container + label AFTER `isAdConfirmed === true`
   - Return `null` during loading phase

**Updated Logic Flow:**
```text
1. loadBannerAd() → backend returns ad_html
2. Set adHtml state
3. Start 2500ms timeout
4. Render hidden iframe
5. Wait for onLoad event
   - If onLoad fires → set isAdConfirmed = true → show container
   - If timeout expires first → set adHtml = null → render nothing
```

## Part 2: Extend SmartBanner to Additional Pages

### Target Pages for Banner Ads

| Page | Placements | Location Details |
|------|------------|------------------|
| LandingPage.tsx | A, B, C | After features, after benefits, before footer |
| Blog.tsx | A, C | After hero, before footer |
| BlogPost.tsx | A, B, C | After title, mid-content, before footer |
| FAQ.tsx | A, C | After FAQ list, before footer |
| About.tsx | A, C | After values section, before footer |
| Compare.tsx | A, B, C | After hero, mid-page, before CTA |
| CheggComparison.tsx | A, C | After comparison table, before footer |
| StudocuComparison.tsx | A, C | After comparison table, before footer |
| QuizletComparison.tsx | A, C | After comparison table, before footer |
| ChatGPTComparison.tsx | A, C | After comparison table, before footer |
| CourseHeroComparison.tsx | A, C | After comparison table, before footer |
| StudyFetchComparison.tsx | A, C | After comparison table, before footer |
| StudyxComparison.tsx | A, C | After comparison table, before footer |

### Placement Guidelines

**Placement A** (Mandatory - highest priority):
- Position: After hero section OR first major content block
- Always attempts to load
- Must succeed for B/C to render

**Placement B** (Optional):
- Position: Mid-page natural break point
- Only renders if: Placement A succeeded AND page height ≥ 2x viewport
- Lazy loaded via IntersectionObserver

**Placement C** (Optional):
- Position: Above footer / CTA section
- Only renders if: Placement A succeeded
- Lazy loaded via IntersectionObserver

## Detailed File Changes

### 1. `src/components/SmartBanner.tsx` (Fix)

**Changes:**
- Add `isAdConfirmed` state (boolean, default false)
- Add `timeoutRef` to track confirmation timeout
- Add `handleIframeLoad` callback for iframe onLoad
- Remove loading skeleton completely (lines 160-163)
- Add timeout logic (2500ms) to cancel if no content
- Update render logic to return `null` until `isAdConfirmed === true`
- Move `setPlacementALoaded(true)` to onLoad handler

### 2. `src/pages/LandingPage.tsx`

**Add imports:**
```tsx
import { SmartBanner } from "@/components/SmartBanner";
```

**Add placements:**
- Placement A: After Features section (line ~208)
- Placement B: After Benefits section (line ~275)
- Placement C: Before CTASection (line ~283)

### 3. `src/pages/Blog.tsx`

**Add imports and placements:**
- Placement A: After hero section, before blog grid (line ~128)
- Placement C: Before Footer (line ~176)

### 4. `src/pages/BlogPost.tsx`

**Add imports and placements:**
- Placement A: After post header/meta (after title and date)
- Placement B: Mid-content (after ~50% of blog content)
- Placement C: Before related posts or footer

### 5. `src/pages/FAQ.tsx`

**Add imports and placements:**
- Placement A: After FAQ accordion (line ~141)
- Placement C: Before CTA section (line ~144)

### 6. `src/pages/About.tsx`

**Add imports and placements:**
- Placement A: After Values section (line ~117)
- Placement C: Before CTA section (line ~122)

### 7. `src/pages/compare/Compare.tsx`

**Add imports and placements:**
- Placement A: After NewtonAI highlights (line ~116)
- Placement B: After competitor grid (line ~188)
- Placement C: Before CTA section (line ~261)

### 8. Individual Compare Pages (7 files)

Files:
- `src/pages/compare/CheggComparison.tsx`
- `src/pages/compare/StudocuComparison.tsx`
- `src/pages/compare/QuizletComparison.tsx`
- `src/pages/compare/ChatGPTComparison.tsx`
- `src/pages/compare/CourseHeroComparison.tsx`
- `src/pages/compare/StudyFetchComparison.tsx`
- `src/pages/compare/StudyxComparison.tsx`

**Pattern for each:**
- Placement A: After ComparisonTable section
- Placement C: Before CTASection

## Pages Excluded from Ads

These pages should NOT have ads (sensitive or transactional):
- Auth.tsx (login/signup flow)
- Pricing.tsx (purchase decisions)
- Profile.tsx (user settings)
- Onboarding.tsx (new user flow)
- PDFChat.tsx (deep study mode)
- Index.tsx (main app - has tool-specific ads)
- Tools.tsx (tool index - navigational)
- Privacy.tsx, Terms.tsx, Refund.tsx (legal pages)
- Contact.tsx, Enterprise.tsx (business pages)
- Payment Success/Failure pages

## Technical Implementation

### SmartBanner Fix Code Structure

```tsx
// New states
const [isAdConfirmed, setIsAdConfirmed] = useState(false);
const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

// Handle iframe load confirmation
const handleIframeLoad = useCallback(() => {
  clearTimeout(timeoutRef.current);
  setIsAdConfirmed(true);
  if (placement === "A") {
    setPlacementALoaded(true);
  }
}, [placement, setPlacementALoaded]);

// In useEffect after setting adHtml:
if (response.ad_html) {
  setAdHtml(response.ad_html);
  
  // Start timeout - collapse if no load in 2500ms
  timeoutRef.current = setTimeout(() => {
    if (!isAdConfirmed) {
      setAdHtml(null); // Force collapse
    }
  }, 2500);
}

// Cleanup
useEffect(() => {
  return () => clearTimeout(timeoutRef.current);
}, []);

// Render logic - ONLY when confirmed
if (!isAdConfirmed || !adHtml) return null;
```

### Page Integration Pattern

```tsx
// Import at top
import { SmartBanner } from "@/components/SmartBanner";

// In JSX - after major section
<section className="py-16">
  {/* Section content */}
</section>

<SmartBanner placement="A" />

<section className="py-16">
  {/* Next section */}
</section>
```

## Context Provider Check

The `BannerAdProvider` is already wrapped in `App.tsx`, so all pages will have access to the banner ad context.

## Summary of Changes

| Category | Files | Changes |
|----------|-------|---------|
| Fix | SmartBanner.tsx | Add confirmation state, timeout, remove skeleton |
| Landing | LandingPage.tsx | Add 3 placements (A, B, C) |
| Blog | Blog.tsx, BlogPost.tsx | Add 2-3 placements each |
| Info | FAQ.tsx, About.tsx | Add 2 placements each |
| Compare | Compare.tsx + 7 comparison pages | Add 2-3 placements each |

**Total files to modify:** 12 files
**Total new banner placements:** ~25 placements across all pages

## Result

1. Ad containers only appear when an actual ad successfully loads
2. No empty "Sponsored" labels or placeholder containers
3. Banner ads appear naturally on landing and content pages
4. Premium users never see ads (existing suppression works)
5. Ads never interrupt study flow or sensitive pages
