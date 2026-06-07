
## Goal

Add a new investor-facing deck at `/pitch-deck` (separate from the existing product-tour `/pitch`) that follows the master prompt's 9 slides and reuses the visual language already established in `src/pitch/` (light gradient background, dot grid, blob glows, Plus Jakarta Sans, gradient-bordered Logo, BottomNav).

## Route & Shell

- New page `src/pages/InvestorPitchDeck.tsx` modeled on `src/pages/PitchPresentation.tsx` (same keyboard nav, fullscreen, presenter mode, BottomNav, AnimatePresence transitions, light gradient background).
- New folder `src/pitch-deck/` mirroring `src/pitch/` structure, reusing `SlideShell`, `Logo`, `BottomNav` from `src/pitch/components/` (import directly — no duplication).
- Register `/pitch-deck` route in `src/App.tsx`.
- Slide index file `src/pitch-deck/slides/index.ts` exports the 9 slides.

## 9 Slides (each a separate component in `src/pitch-deck/slides/`)

1. **Slide01Intro** — Company name, tagline "The Intelligent Classroom Operating System", founder cards (Karamveer Singh CEO, Saif Malik BD), vision statement. Two-column founder layout with avatar circles + role chips.
2. **Slide02Problem** — "Education is running on too many disconnected tools." Top row: scattered tool chips (PowerPoint, Google Classroom, LMS, Attendance, Quiz, Results, Comms). Three problem columns: Teachers / Students / Institutions, each with 4–5 bullets.
3. **Slide03Solution** — "NewtonAI = One Platform for the Entire Classroom." 4×4 feature grid (Smart Board OS, AI Teaching Assistant, Live Pulse, AI Notes, OCR, Voice-to-Notes, Attendance, Quiz Auto, Marks/Results, Analytics, Parent Dashboard, Institution Dashboard, Class AI Tutor, AI Video Search, Post-Class Reports) + bottom strip "One Platform · One Login · One Ecosystem."
4. **Slide04Market** — TAM/SAM/SOM concentric rings ($404B / $85B / $8B) on left, **student study tool comparison table** on right (NewtonAI vs ChatGPT, Quizlet, Chegg, StudyFetch, Course Hero — pulling features from `src/pages/compare/competitorData.ts`: AI Quiz, Flashcards, Podcast, PDF Chat, Mind Maps, Homework Help, Summariser, Newton Chat tutor, Ad-Free Videos). Pricing strip below.
5. **Slide05BusinessModel** — Two-card split: India B2B (₹500/mo/student, ₹6,000/yr ARPU) | Global B2C ($10/mo, $80–120/yr ARPU). Additional revenue chips: Enterprise, White Label, Premium Credits, Analytics, API.
6. **Slide06Financials** — 5-year bar/line chart (Recharts) Years 1→5: 8k/15k/30k/60k/100k students, ₹5.3Cr → ₹67Cr+. KPI tiles below: Gross Margin 75–85%, EBITDA trend, Net Profit.
7. **Slide07InvestmentAsk** — Three large stat tiles: ₹6.5 Cr pre-money | ₹65 L raise | 10% equity. Cap table donut (Karamveer 90 / Saif 10) + "Why Invest" bullet list.
8. **Slide08UseOfFunds** — Recharts pie chart with 6 wedges (Product 35%, AI Infra 20%, S&M 20%, Hiring 15%, Ops 5%, Working Cap 5%) + matching legend with ₹ amounts.
9. **Slide09ThankYou** — Big NewtonAI logo, mission line, website + contact, founder name, UPI-analogy closing quote in italic.

## Design Tokens (match `/pitch`)

- Background: `linear-gradient(135deg, #FAFBFF 0%, #EEF2FF 45%, #F3F0FF 100%)` (already in PitchPresentation).
- Reuse `SlideShell` so dot grid, blob glows, Logo placement are identical.
- Font: `Plus Jakarta Sans` (already loaded via Helmet in PitchPresentation; replicate Helmet in InvestorPitchDeck).
- Accent colors per section header (matching existing `categoryColor` convention): indigo `#6366F1`, emerald `#059669`, amber `#B45309`, rose `#E11D48`.
- Cards: rounded-2xl, white/70 backdrop-blur, soft colored borders — same pattern as `ToolSlideLayout`'s BulletCard.
- Headings: 900 weight, `-0.035em` tracking, 34–80px range mirroring existing slides.

## Charts

- Use `recharts` (already in package.json — used elsewhere in app) for the financial growth chart (Slide 6), cap table donut (Slide 7), use-of-funds pie (Slide 8).

## Out of Scope

- No PPTX/DOCX rebuild this turn — that can follow once the new deck is approved.
- No edits to existing `/pitch` slides.
- No backend / DB changes.

## Files to Create

- `src/pages/InvestorPitchDeck.tsx`
- `src/pitch-deck/slides/index.ts`
- `src/pitch-deck/slides/Slide01Intro.tsx` … `Slide09ThankYou.tsx` (9 files)

## Files to Edit

- `src/App.tsx` — add `<Route path="/pitch-deck" element={<InvestorPitchDeck />} />` with lazy import.
