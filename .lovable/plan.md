
# SEO and AI Search Engine Optimization for NewtonAI.site

## Overview

Comprehensive SEO overhaul covering meta tags, structured data, new content pages, landing page content, LLM discovery page, domain references update, and performance optimizations.

## 1. Domain References Update (Critical)

All sitemaps, structured data, and SEO references currently point to `newtonai.lovable.app`. These must be updated to `newtonai.site`:

**Files affected:**
- `src/components/SEOHead.tsx` -- change `SITE_URL` to `https://newtonai.site`
- `index.html` -- update all `og:url`, `og:image`, schema URLs
- `public/robots.txt` -- update sitemap URL
- `public/sitemap.xml` -- update all `<loc>` URLs
- `public/sitemap-index.xml` -- same
- `public/sitemap-pages.xml` -- same
- `public/sitemap-tools.xml` -- same
- `public/sitemap-blog.xml` -- same

## 2. Meta SEO Updates

**File: `index.html`**
- Title: `NewtonAI - AI Study Assistant for Students | Notes, PDF Summaries, Quiz Generator`
- Description: `NewtonAI is an AI-powered study assistant for students that converts notes, PDFs and study materials into summaries, quizzes and flashcards for faster exam preparation.`
- Add keywords meta tag: `AI study assistant, AI notes generator, PDF summarizer, quiz generator, flashcard maker, exam preparation, AI for students, study tools`

**File: `src/pages/LandingPage.tsx`**
- Update SEOHead title/description to match the optimized versions above

## 3. Structured Data Enhancement

**File: `index.html`** -- Replace existing schemas with richer versions:

- **SoftwareApplication** with `EducationalApplication` category, audience `Student`, features list, offers (free tier)
- **Organization** with updated `newtonai.site` URLs
- **WebSite** with SearchAction pointing to `newtonai.site`
- **New: FAQPage schema** on the landing page with common questions
- **New: ItemList schema** listing the key tools

## 4. Landing Page SEO Content Section

**File: `src/pages/LandingPage.tsx`** -- Add a new "What is NewtonAI" section between the features grid and the mid-page CTA:

- H2: "What is NewtonAI?"
- Paragraph explaining it is an AI study assistant for students
- H3: "Who is NewtonAI For?" -- targeting students, exam prep, self-learners
- H3: "Key Features" -- PDF summarizer, notes generator, quiz maker, flashcards, mind maps, podcasts
- Proper semantic HTML hierarchy (h1 already exists in hero)
- ~300 words of natural, keyword-rich content

## 5. New SEO Pages (5 pages + 1 LLM page)

Create 6 new page components, each with 800+ words, FAQ sections, and internal links:

| Route | File | Topic |
|-------|------|-------|
| `/ai-study-assistant` | `src/pages/seo/AIStudyAssistant.tsx` | What is an AI Study Assistant |
| `/ai-notes-generator` | `src/pages/seo/AINotesGenerator.tsx` | AI Notes Generator tool |
| `/pdf-study-tool` | `src/pages/seo/PDFStudyTool.tsx` | PDF Study Tool overview |
| `/ai-quiz-generator` | `src/pages/seo/AIQuizGenerator.tsx` | AI Quiz Generator tool |
| `/exam-preparation-ai` | `src/pages/seo/ExamPreparationAI.tsx` | AI for Exam Preparation |
| `/about-newtonai-for-ai` | `src/pages/seo/AboutNewtonAIForAI.tsx` | LLM Discovery Page |

Each page will include:
- SEOHead with optimized title, description, keywords, canonical, breadcrumbs
- H1/H2/H3 semantic hierarchy
- 800+ words of educational content
- FAQ section with 5-6 questions using `details`/`summary` elements
- Internal links to related tools and the signup page
- CTA section at the bottom

## 6. LLM Discovery Page (`/about-newtonai-for-ai`)

Special page designed for AI crawlers:
- Neutral, factual definition of NewtonAI
- Structured use cases for students
- How it differs from generic chatbots (domain-specific, study-focused, curriculum-aware)
- Machine-readable format with clear headings

## 7. Route Registration and Navigation

**File: `src/App.tsx`** -- Add 6 new routes

**File: `src/components/Footer.tsx`** -- Add links to new SEO pages under a "Learn More" column

**File: `public/sitemap-pages.xml`** -- Add all 6 new URLs

## 8. Social SEO / Open Graph

**File: `index.html`** -- Update OG tags with optimized title/description, ensure `og:image` points to `newtonai.site/logo.png`

Twitter card tags already exist -- update to match new title/description.

## 9. Performance SEO

- **Lazy loading**: Wrap new SEO page imports in `React.lazy()` with `Suspense` fallback in `App.tsx`
- **Image optimization**: Add `loading="lazy"` to any images in new pages
- **Semantic HTML**: All new pages use `article`, `section`, `header`, `nav` elements
- **Mobile-first**: All new pages use existing Tailwind responsive classes

## Summary of All Files

**Modified (10 files):**
1. `index.html` -- meta tags, structured data, domain URLs
2. `src/components/SEOHead.tsx` -- SITE_URL update
3. `src/pages/LandingPage.tsx` -- SEO content section, updated SEOHead props
4. `src/App.tsx` -- 6 new routes
5. `src/components/Footer.tsx` -- new links
6. `public/robots.txt` -- domain update
7. `public/sitemap.xml` -- domain update
8. `public/sitemap-index.xml` -- domain update
9. `public/sitemap-pages.xml` -- domain update + new URLs
10. `public/sitemap-tools.xml` -- domain update

**Created (6 files):**
1. `src/pages/seo/AIStudyAssistant.tsx`
2. `src/pages/seo/AINotesGenerator.tsx`
3. `src/pages/seo/PDFStudyTool.tsx`
4. `src/pages/seo/AIQuizGenerator.tsx`
5. `src/pages/seo/ExamPreparationAI.tsx`
6. `src/pages/seo/AboutNewtonAIForAI.tsx`
