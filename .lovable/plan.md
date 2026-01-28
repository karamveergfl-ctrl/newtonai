
# Plan: Add Adsterra Banners Site-Wide

## Overview
Add both the 728x90 Adsterra banner (`AdsterraBanner`) and the native Adsterra banner (`AdsterraNativeBanner`) to all pages across the application, with multiple placements on longer pages to maximize ad coverage.

## Pages to Update

### Header Navigation Pages

**1. Home/Landing Page (`src/pages/LandingPage.tsx`)** - Already has ads
- Currently has 1 placement between Features and Benefits
- **Add more placements:**
  - After Hero section (before Features)
  - After Testimonials section (before CTA)

**2. Tools Page (`src/pages/Tools.tsx`)** - Already has ads
- No changes needed

**3. Compare Page (`src/pages/compare/Compare.tsx`)** - Has native ads only
- **Add 728x90 banner** alongside existing native ads at:
  - After highlights (before competitor grid)
  - Before feature matrix

**4. Pricing Page (`src/pages/Pricing.tsx`)** - Already has ads
- No changes needed

**5. Blog Page (`src/pages/Blog.tsx`)** - No ads currently
- **Add placements:**
  - Between hero and blog posts grid
  - After blog posts grid (before footer)

**6. About Page (`src/pages/About.tsx`)** - Has native ad only
- **Add 728x90 banner** alongside existing native ad
- **Add another pair** after hero section

**7. FAQ Page (`src/pages/FAQ.tsx`)** - Has native ads only
- **Add 728x90 banners** alongside existing native ads

### Sidebar Study Tools Pages

**8. AI Quiz (`src/pages/tools/AIQuiz.tsx`)** - Has native ad
- **Add 728x90 banner** before native ad placement

**9. AI Flashcards (`src/pages/tools/AIFlashcards.tsx`)** - Has native ad
- **Add 728x90 banner** before native ad placement

**10. AI Podcast (`src/pages/tools/AIPodcast.tsx`)** - Has native ad
- **Add 728x90 banner** before native ad placement

**11. Chat with PDF (`src/pages/PDFChat.tsx`)** - No ads
- This is a fullscreen split-view tool - **Skip ads** to maintain UX

**12. Mind Map (`src/pages/tools/MindMap.tsx`)** - Has native ad
- **Add 728x90 banner** before native ad placement

**13. AI Lecture Notes (`src/pages/tools/AILectureNotes.tsx`)** - Has native ad
- **Add 728x90 banner** before native ad placement

**14. AI Summarizer (`src/pages/tools/AISummarizer.tsx`)** - Has native ad
- **Add 728x90 banner** before native ad placement

**15. Homework Help (`src/pages/tools/HomeworkHelp.tsx`)** - Has native ad
- **Add 728x90 banner** before native ad placement

### Comparison Pages

**16. Chegg Comparison (`src/pages/compare/CheggComparison.tsx`)** - Has native ads only
- **Add 728x90 banners** alongside existing native ads

**17. Quizlet Comparison (`src/pages/compare/QuizletComparison.tsx`)**
- **Add 728x90 and native banners** (after table, after pricing)

**18. Studocu Comparison (`src/pages/compare/StudocuComparison.tsx`)**
- **Add 728x90 and native banners** (after table, after pricing)

**19. Course Hero Comparison (`src/pages/compare/CourseHeroComparison.tsx`)**
- **Add 728x90 and native banners** (after table, after pricing)

**20. ChatGPT Comparison (`src/pages/compare/ChatGPTComparison.tsx`)**
- **Add 728x90 and native banners** (after table, after pricing)

**21. StudyFetch Comparison (`src/pages/compare/StudyFetchComparison.tsx`)**
- **Add 728x90 and native banners** (after table, after pricing)

**22. Studyx Comparison (`src/pages/compare/StudyxComparison.tsx`)** - Already updated
- No changes needed

### Other Pages

**23. Contact Page (`src/pages/Contact.tsx`)** - Has native ad
- **Add 728x90 banner** before native ad

**24. Enterprise Page (`src/pages/Enterprise.tsx`)** - No ads
- **Add both banners** after features grid, before contact form

**25. Blog Post Page (`src/pages/BlogPost.tsx`)** - Check and add ads
- **Add banners** between content sections

---

## Technical Implementation

### Import Statement to Add
```tsx
import { AdsterraBanner } from "@/components/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/AdsterraNativeBanner";
```

### Standard Ad Block Pattern
```tsx
{/* Ad Section */}
<div className="container mx-auto px-4 py-8">
  <AdsterraBanner />
  <AdsterraNativeBanner />
</div>
```

For pages within AppLayout (study tools):
```tsx
<AdsterraBanner />
<AdsterraNativeBanner instanceId="tool-placement" />
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/LandingPage.tsx` | Add 2 more ad sections |
| `src/pages/Blog.tsx` | Add 2 ad sections |
| `src/pages/About.tsx` | Add 728x90 banner + 1 more section |
| `src/pages/FAQ.tsx` | Add 728x90 banners to 2 existing placements |
| `src/pages/Contact.tsx` | Add 728x90 banner |
| `src/pages/Enterprise.tsx` | Add both banners |
| `src/pages/BlogPost.tsx` | Add both banners |
| `src/pages/compare/Compare.tsx` | Add 728x90 banners to 2 existing placements |
| `src/pages/compare/CheggComparison.tsx` | Add 728x90 banners |
| `src/pages/compare/QuizletComparison.tsx` | Add both banners |
| `src/pages/compare/StudocuComparison.tsx` | Add both banners |
| `src/pages/compare/CourseHeroComparison.tsx` | Add both banners |
| `src/pages/compare/ChatGPTComparison.tsx` | Add both banners |
| `src/pages/compare/StudyFetchComparison.tsx` | Add both banners |
| `src/pages/tools/AIQuiz.tsx` | Add 728x90 banner |
| `src/pages/tools/AIFlashcards.tsx` | Add 728x90 banner |
| `src/pages/tools/AIPodcast.tsx` | Add 728x90 banner |
| `src/pages/tools/MindMap.tsx` | Add 728x90 banner |
| `src/pages/tools/AILectureNotes.tsx` | Add 728x90 banner |
| `src/pages/tools/AISummarizer.tsx` | Add 728x90 banner |
| `src/pages/tools/HomeworkHelp.tsx` | Add 728x90 banner |

**Total: 21 files to modify**

---

## Summary
This plan adds comprehensive Adsterra ad coverage across all 21+ pages in the application:
- All header navigation pages (Home, Tools, Compare, Pricing, Blog, About, FAQ)
- All sidebar study tool pages (Quiz, Flashcards, Podcast, Mind Map, Lecture Notes, Summarizer, Homework Help)
- All comparison pages (7 competitor comparisons)
- Corporate pages (Contact, Enterprise, Blog Post)

Each long page will have multiple ad placements (2-4) strategically placed between major content sections.
