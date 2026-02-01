

# Plan: Add Ad Banners Across All Pages

## Summary

I'll ensure ad banners are properly placed across all pages of the NewtonAI application, including adding a new banner above the footer on the dashboard page as shown in your reference image.

---

## Current Ad Status Analysis

### Pages WITH Ads (Already Implemented)

| Page | Ad Placements |
|------|---------------|
| `/` (LandingPage) | 3x `AdBanner` (after features, after benefits, before CTA) |
| `/about` | 1x `AdBanner` (before CTA) |
| `/faq` | 2x `AdBanner` (after FAQ list, before footer) |
| `/compare` | 3x `AdBanner` (after highlights, after grid, before CTA) |
| `/compare/chegg` | 2x `AdBanner` |
| `/compare/quizlet` | 2x `AdBanner` |
| `/compare/studocu` | 2x `AdBanner` |
| `/compare/studyfetch` | 2x `AdBanner` |
| `/compare/course-hero` | 2x `AdBanner` |
| `/compare/chatgpt` | 2x `AdBanner` |
| `/compare/studyx` | 2x `AdBanner` |
| `/tools/quiz` | 1x `PrimaryAdBanner` + `ToolPagePromoSections` (contains 2x `AdBanner`) |
| `/tools/flashcards` | 1x `PrimaryAdBanner` + `ToolPagePromoSections` |
| `/tools/homework-help` | 1x `PrimaryAdBanner` + `ToolPagePromoSections` |
| `/tools/summarizer` | 1x `PrimaryAdBanner` + `ToolPagePromoSections` |
| `/tools/mind-map` | 1x `PrimaryAdBanner` + `ToolPagePromoSections` |
| `/tools/ai-podcast` | 1x `PrimaryAdBanner` + `ToolPagePromoSections` |
| `/tools/ai-notes` | 1x `PrimaryAdBanner` + `ToolPagePromoSections` |

### Pages WITHOUT Ads (Need Adding)

| Page | Current State | Proposed Ads |
|------|---------------|--------------|
| `/dashboard` (Index.tsx) | No ads | Add 1x `AdBanner` above footer in AppLayout |
| `/pricing` | No ads | Add 1x `AdBanner` after pricing cards |
| `/contact` | No ads | Add 1x `AdBanner` before footer |
| `/enterprise` | No ads | Add 1x `AdBanner` before footer |
| `/terms` | No ads | Add 1x `AdBanner` before footer |
| `/privacy` | No ads | Add 1x `AdBanner` before footer |
| `/refund` | No ads | Add 1x `AdBanner` before footer |
| `/tools` (Tools.tsx) | No ads | Add 1x `AdBanner` mid-page |

---

## Implementation Plan

### Phase 1: Add Global Footer Ad to AppLayout (Dashboard)

Modify `src/components/AppLayout.tsx` to include an `AdBanner` above the footer. This ensures ALL authenticated pages using `AppLayout` get a banner above the footer automatically.

**Files to Modify:**
- `src/components/AppLayout.tsx`

**Changes:**
```tsx
// Import AdBanner
import { AdBanner } from "@/components/AdBanner";

// Add AdBanner above Footer in ScrollableContent
<AdBanner className="mb-0" />
{showFooter && <Footer />}
```

### Phase 2: Add Ads to Missing Static Pages

| File | Changes |
|------|---------|
| `src/pages/Pricing.tsx` | Add 1x `AdBanner` after feature comparison table |
| `src/pages/Contact.tsx` | Add 1x `AdBanner` before footer |
| `src/pages/Enterprise.tsx` | Add 1x `AdBanner` after features, before form |
| `src/pages/Terms.tsx` | Add 1x `AdBanner` before footer |
| `src/pages/Privacy.tsx` | Add 1x `AdBanner` before footer |
| `src/pages/Refund.tsx` | Add 1x `AdBanner` before footer |
| `src/pages/Tools.tsx` | Add 1x `AdBanner` mid-page |

### Phase 3: Ensure Instant Ad Loading with loading="eager"

Both `AdBanner` and `PrimaryAdBanner` already use `loading="eager"` attribute which ensures ads load immediately when users navigate or scroll. No changes needed.

---

## Files to Modify (Complete List)

| File | Action |
|------|--------|
| `src/components/AppLayout.tsx` | Add `AdBanner` above Footer for dashboard pages |
| `src/pages/Pricing.tsx` | Add `AdBanner` import and placement |
| `src/pages/Contact.tsx` | Add `AdBanner` import and placement |
| `src/pages/Enterprise.tsx` | Add `AdBanner` import and placement |
| `src/pages/Terms.tsx` | Add `AdBanner` import and placement |
| `src/pages/Privacy.tsx` | Add `AdBanner` import and placement |
| `src/pages/Refund.tsx` | Add `AdBanner` import and placement |
| `src/pages/Tools.tsx` | Add `AdBanner` import and placement |

---

## Technical Details

### Ad Suppression Logic

Both ad components already implement proper suppression:

- **`AdBanner`**: Hidden for `isPremium` users OR during `isInDeepStudy`
- **`PrimaryAdBanner`**: Only hidden for confirmed `isPremium` users (visible during loading to maximize fill rate)

### Ad Key Configuration

Using the newly whitelisted Adsterra key:
- **Key:** `fe9d10672684b2efb3db57ecdb954f85`
- **Domain:** `newtonai.lovable.app`
- **Format:** 728x90 leaderboard

### Instant Loading

The iframe uses `loading="eager"` which bypasses lazy loading, ensuring ads appear immediately when users navigate to pages.

---

## Ad Placement Examples

### Dashboard Page (After Changes)

```
[Sidebar] | [Main Content Area]
          | [Upload Section]
          | [Topic-Based Video Search Card]
          | [Screenshot to Solve Card]
          |      ...
          | [AdBanner] ← NEW (above footer)
          | [Footer]
```

### Pricing Page (After Changes)

```
[Header]
[Pricing Cards (Free/Pro/Ultra)]
[Feature Comparison Table]
[AdBanner] ← NEW
[Enterprise CTA]
[Footer]
```

---

## Expected Result

After implementing these changes:

1. All pages will have at least one ad banner placement
2. Dashboard page specifically will show an ad above the footer
3. Ads will load instantly on navigation/scroll using `loading="eager"`
4. Premium users and deep study mode will continue to hide ads
5. Consistent ad experience across the entire application

