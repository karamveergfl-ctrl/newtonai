

## Plan: Remove Lazy Loading and Add Native Ads to All Pages

### Overview
This plan will modify the `NativeAdBanner` component to remove lazy loading functionality and add native ad banners to all available pages in the NewtonAI application.

---

### Part 1: Simplify NativeAdBanner Component

**File: `src/components/NativeAdBanner.tsx`**

Changes:
- Remove the `lazyLoad` prop entirely
- Remove the `isVisible` state and IntersectionObserver logic
- Load ads immediately on mount
- Keep the `useCanShowMidPageAd` hook for mid-page height checking

---

### Part 2: Update Existing Tool Page Integration

**File: `src/components/tool-sections/ToolPagePromoSections.tsx`**

Changes:
- Remove `lazyLoad={false}` and `lazyLoad={true}` props from NativeAdBanner components since lazy loading is being removed

---

### Part 3: Add Ads to All Pages

Below is the complete list of pages that will receive native ad banners:

| Page | File | Ad Placements |
|------|------|---------------|
| Landing Page | `src/pages/LandingPage.tsx` | Above footer |
| About | `src/pages/About.tsx` | Above footer CTA |
| Blog | `src/pages/Blog.tsx` | Below hero, Above footer |
| Blog Post | `src/pages/BlogPost.tsx` | Below title, Above footer |
| Contact | `src/pages/Contact.tsx` | Above footer |
| FAQ | `src/pages/FAQ.tsx` | Below accordion, Above CTA |
| Pricing | `src/pages/Pricing.tsx` | Below comparison table |
| Enterprise | `src/pages/Enterprise.tsx` | Above footer |
| Tools Index | `src/pages/Tools.tsx` | Below tools grid, Above CTA |
| Credits | `src/pages/Credits.tsx` | Above footer area |

**Tool Pages (already integrated via ToolPagePromoSections):**
- AI Flashcards
- AI Quiz  
- AI Podcast
- AI Summarizer
- AI Lecture Notes
- Mind Map
- Homework Help

---

### Technical Details

#### NativeAdBanner Changes

The component will be simplified to:
1. Immediately load the Adsterra script on mount
2. Keep placement-based styling for proper spacing
3. Maintain error handling (hide container if script fails)
4. Keep the `useCanShowMidPageAd` hook unchanged

#### Page Integration Pattern

Each page will import and use the component like this:

```tsx
import { NativeAdBanner } from "@/components/NativeAdBanner";

// In JSX - typically above Footer:
<NativeAdBanner placement="above-footer" />
```

For longer pages, additional placements:
```tsx
<NativeAdBanner placement="below-action" />
<NativeAdBanner placement="mid-page" />
```

---

### Files to Modify

1. `src/components/NativeAdBanner.tsx` - Remove lazy loading logic
2. `src/components/tool-sections/ToolPagePromoSections.tsx` - Remove lazyLoad props
3. `src/pages/LandingPage.tsx` - Add ad above footer
4. `src/pages/About.tsx` - Add ad above footer CTA
5. `src/pages/Blog.tsx` - Add ads below hero and above footer
6. `src/pages/BlogPost.tsx` - Add ads below title and above footer
7. `src/pages/Contact.tsx` - Add ad above footer
8. `src/pages/FAQ.tsx` - Add ad below accordion
9. `src/pages/Pricing.tsx` - Add ad below comparison table
10. `src/pages/Enterprise.tsx` - Add ad above footer
11. `src/pages/Tools.tsx` - Add ads below grid and above CTA
12. `src/pages/Credits.tsx` - Add ad in appropriate location

---

### Placement Rules Maintained

- Maximum 3 ads per page
- No ads inside PDF viewers, quiz questions, or solutions (excluded components)
- Ads placed as natural content breaks
- Consistent spacing around ads
- Mobile-responsive design

