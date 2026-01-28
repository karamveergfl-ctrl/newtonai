
# Plan: Add Adsterra Native Ads Across the Site

## Summary
This plan implements Adsterra native ads throughout the NewtonAI platform in the locations you specified, including:
1. Above the footer (already done)
2. Between content sections (like feature cards and other sections)
3. Between "Process File" button and "Your Recent Activity" on all tool pages
4. Between features and "Trending Now" sections on all tool pages
5. Below "View all FAQs" link
6. Between content sections on other pages

The ads will be responsive and mobile-optimized.

---

## Technical Approach

### 1. Create an Enhanced Ad Component

Update the existing `AdsterraNativeBanner` component to support:
- Unique instance IDs to allow multiple ads per page
- Mobile-responsive sizing
- Optional margin/padding props for consistent spacing

```text
src/components/AdsterraNativeBanner.tsx
- Add unique ID generation for each instance
- Add responsive container styling
- Add optional spacing props (my-8, py-4, etc.)
```

### 2. Tool Pages Ad Placements

Modify all 7 tool pages to add ads at the specified locations:

| File | Placement |
|------|-----------|
| `src/pages/tools/AIQuiz.tsx` | Between input card and InlineRecents |
| `src/pages/tools/AIFlashcards.tsx` | Between input card and InlineRecents |
| `src/pages/tools/AISummarizer.tsx` | Between input card and InlineRecents |
| `src/pages/tools/HomeworkHelp.tsx` | Between input card and InlineRecents |
| `src/pages/tools/AIPodcast.tsx` | Between input card and InlineRecents |
| `src/pages/tools/MindMap.tsx` | Between input card and InlineRecents |
| `src/pages/tools/AILectureNotes.tsx` | Between input card and InlineRecents |

### 3. ToolPagePromoSections Ad Placements

Modify the promotional sections component to add ads:

```text
src/components/tool-sections/ToolPagePromoSections.tsx
- Add ad between ToolPageFeatures and ToolPageTrendingTopics
- Add ad between ToolPageSubjects and ToolPageOtherTools
```

### 4. ToolPageFAQ Ad Placement

Add ad below the "View all FAQs" link:

```text
src/components/tool-sections/ToolPageFAQ.tsx
- Add AdsterraNativeBanner after the "View all FAQs" link
```

### 5. Compare Pages Ad Placements

Add ads to all comparison pages:

| File | Placements |
|------|------------|
| `src/pages/compare/CheggComparison.tsx` | Between sections |
| `src/pages/compare/QuizletComparison.tsx` | Between sections |
| `src/pages/compare/StudocuComparison.tsx` | Between sections |
| `src/pages/compare/CourseHeroComparison.tsx` | Between sections |
| `src/pages/compare/ChatGPTComparison.tsx` | Between sections |
| `src/pages/compare/StudyxComparison.tsx` | Between sections |
| `src/pages/compare/StudyFetchComparison.tsx` | Between sections |
| `src/pages/compare/Compare.tsx` | Between grid and CTA |

### 6. Company Pages Ad Placements

Add ads to company pages:

| File | Placements |
|------|------------|
| `src/pages/About.tsx` | Between values and CTA sections |
| `src/pages/Contact.tsx` | Below contact form |
| `src/pages/FAQ.tsx` | Between FAQ accordion sections |
| `src/pages/Pricing.tsx` | Below pricing cards |

### 7. Tools Index Page

```text
src/pages/Tools.tsx
- Add ad between tools grid and CTA section
```

### 8. Footer Enhancement

Already implemented - ad appears above the bottom copyright section.

---

## Files to Modify

### Core Ad Component
- `src/components/AdsterraNativeBanner.tsx` - Enhance with unique IDs and responsive styling

### Tool Pages (7 files)
- `src/pages/tools/AIQuiz.tsx`
- `src/pages/tools/AIFlashcards.tsx`
- `src/pages/tools/AISummarizer.tsx`
- `src/pages/tools/HomeworkHelp.tsx`
- `src/pages/tools/AIPodcast.tsx`
- `src/pages/tools/MindMap.tsx`
- `src/pages/tools/AILectureNotes.tsx`

### Tool Section Components (2 files)
- `src/components/tool-sections/ToolPagePromoSections.tsx`
- `src/components/tool-sections/ToolPageFAQ.tsx`

### Compare Pages (8 files)
- `src/pages/compare/Compare.tsx`
- `src/pages/compare/CheggComparison.tsx`
- `src/pages/compare/QuizletComparison.tsx`
- `src/pages/compare/StudocuComparison.tsx`
- `src/pages/compare/CourseHeroComparison.tsx`
- `src/pages/compare/ChatGPTComparison.tsx`
- `src/pages/compare/StudyxComparison.tsx`
- `src/pages/compare/StudyFetchComparison.tsx`

### Company Pages (4 files)
- `src/pages/About.tsx`
- `src/pages/Contact.tsx`
- `src/pages/FAQ.tsx`
- `src/pages/Pricing.tsx`

### Other Pages (1 file)
- `src/pages/Tools.tsx`

---

## Mobile Optimization

The ad component will include:
- Responsive container with `w-full max-w-full`
- Proper padding on mobile devices (`px-4 sm:px-0`)
- Consistent vertical spacing (`my-6 md:my-8`)
- Overflow handling to prevent horizontal scroll

---

## Implementation Steps

1. Update `AdsterraNativeBanner.tsx` to support multiple instances
2. Add ads to all 7 tool pages (between input and recents)
3. Update `ToolPagePromoSections.tsx` (between features/trending)
4. Update `ToolPageFAQ.tsx` (below View all FAQs)
5. Add ads to all 8 compare pages
6. Add ads to 4 company pages
7. Add ads to Tools index page
8. Test on mobile and desktop viewports

---

## Total Ad Placements Summary

- **Tool pages**: ~14 placements (2 per page x 7 pages)
- **Compare pages**: ~16 placements (2 per page x 8 pages)
- **Company pages**: ~4 placements
- **Tools index**: 1 placement
- **Footer**: 1 placement (already done)

**Total**: ~36 ad placements across the site
