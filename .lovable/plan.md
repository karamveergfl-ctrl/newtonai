

# Pitch Deck -- Showcase All Existing NewtonAI Features

## Overview
Create a `/pitch-deck` route with 6 full-screen, keyboard/scroll/swipe-navigable slides that showcase **every existing feature** of NewtonAI that reduces the student-teacher interaction gap. No new features will be built -- this deck presents what already exists in the platform.

---

## Existing Features to Showcase (Grouped by Slide)

### Slide 1 -- Hero: "NewtonAI -- AI Classroom OS"
- Tagline, value proposition
- Visual: Smart Board center with teacher + student connections
- Key stat highlights (tools count, interaction types)

### Slide 2 -- Smart Board Mode (Live Classroom)
All existing SmartBoard features:
- **Fullscreen Smart Board Mode** -- auto-prompt on large screens, fullscreen teaching experience
- **Digital Whiteboard** -- pen, highlighter, eraser, color picker, undo/redo, clear
- **Whiteboard Auto-Save** -- per-slide canvas state saved automatically
- **Handwriting Recognition** -- board strokes recognized as text, converted to slide content
- **Voice Commands** -- "next slide", "start recording" etc. with voice indicator
- **Lecture Capture/Recording** -- start/stop recording with REC indicator
- **Classroom Theme Toggle** -- dark/light classroom themes
- **Slide Advance Controls** -- navigate slides with auto-note generation
- **Document Teaching View** -- teach directly from uploaded documents

### Slide 3 -- Real-Time Student-Teacher Interaction
- **Pulse Widget (Student)** -- "Got it / Slightly lost / Lost" 3-button feedback
- **Pulse Meter (Teacher)** -- live bar chart of class understanding with confusion alert (auto-dismiss after 30s, threshold-based warning)
- **Anonymous Question Wall** -- students ask anonymously, upvote, teacher filters (All/Unanswered/Pinned), marks answered, pins questions
- **Concept Check** -- AI-generated MCQs mid-lecture, timer countdown, live response tracking, results panel with correct answer reveal
- **Spotlight Sync** -- teacher pushes current slide content to all student screens, students can browse freely or resync, sync indicator

### Slide 4 -- AI-Powered Live Notes and Content
- **Live Notes Generation** -- AI generates structured notes per slide automatically
- **Teacher Notes Overview** -- progress bar showing notes status per slide
- **Student Notes Drawer** -- pull-out drawer with new-note badge indicator
- **Term Definitions Sidebar** -- key terms extracted and defined per slide
- **Post-Session Notes Review** -- complete session notes available after class
- **Slide Content Renderer** -- formatted content with markdown/LaTeX support

### Slide 5 -- AI Study Tools (Student Self-Study)
- **AI Flashcards** -- auto-generated from any document
- **AI Quiz Generator** -- multiple question types, adaptive difficulty
- **AI Summarizer** -- chapter/document summaries at chosen length
- **Mind Map Generator** -- visual concept maps from content
- **AI Lecture Notes** -- audio to structured notes
- **AI Podcast** -- documents converted to listenable audio
- **Homework Help** -- step-by-step problem solutions
- **PDF Chat** -- conversational Q&A with uploaded documents
- **Classroom Hub** -- teacher creates classes, assigns work, tracks performance

### Slide 6 -- Intelligence Reports and Analytics + CTA
- **Teacher Intelligence Report** -- session summary, engagement heatmap, topics to revisit, concept check results, unanswered questions, PDF export
- **Student Intelligence Report** -- understanding score ring, knowledge gaps, weak topic tracker
- **Class Overview** -- strongest/weakest topics, class-wide analytics
- **Institution Features** -- department management, faculty monitoring, compliance, result processing, academic records
- **CTA**: "Let's make every smart board a Classroom Operating System"

---

## Technical Implementation

### New File: `src/pages/PitchDeck.tsx`

**Structure:**
- Single component with `currentSlide` state (0-5)
- 6 slide renderer functions, each returning full-screen JSX
- Each slide is absolutely positioned at `100vw x 100vh` with CSS transition on opacity/transform

**Navigation:**
- Keyboard: ArrowDown/Up/Right/Left, Space (next), Escape (exit fullscreen)
- Scroll: `wheel` event with 500ms debounce
- Touch: swipe detection (touchstart/touchend delta)
- Click: dot indicators on right side
- Bottom-right: Previous/Next buttons + Fullscreen toggle

**Slide Design:**
- Dark gradient background (`from-slate-900 via-slate-800 to-slate-900`)
- Gradient text headings (`from-blue-400 to-purple-400`)
- Glass-morphism content cards (`bg-white/5 border-white/10 backdrop-blur`)
- Icons from `lucide-react`
- CSS `animate-fade-in` with staggered `animation-delay` for content reveal
- Progress bar at top (width = `(currentSlide + 1) / 6 * 100%`)

**Feature Cards Layout:**
- Each feature shown as a compact card with icon + title + 1-line description
- Cards arranged in responsive grids (2-3 columns)
- Hover effect using existing `hover-scale` class

**Animations (CSS-only, per project policy):**
- Slide transition: `opacity` + `translateY` with `transition: all 0.6s ease`
- Content stagger: each card gets `animation-delay: ${index * 0.08}s`
- No framer-motion

### Modified File: `src/App.tsx`
- Add lazy import: `const PitchDeck = lazy(() => import("./pages/PitchDeck"));`
- Add route: `<Route path="/pitch-deck" element={<PitchDeck />} />`
- No ProtectedRoute wrapper -- pitch deck is public

### Modified File: `src/lib/prefetchRoutes.ts`
- Add `/pitch-deck` to the prefetch list

---

## Slide Content Details

### Slide 1 -- Hero
- Title: "NewtonAI -- AI Classroom OS for Smart Boards"
- Subtitle: "One screen. One system. Complete classroom workflow."
- Three stat cards: "15+ AI Tools" / "Real-Time Interaction" / "Complete Analytics"
- Target audience: Universities, colleges, schools with smart boards

### Slide 2 -- Smart Board Mode
- 8 feature cards in a grid:
  1. Fullscreen Smart Board (Maximize icon)
  2. Digital Whiteboard (PenTool icon)
  3. Handwriting Recognition (Type icon)
  4. Voice Commands (Mic icon)
  5. Lecture Recording (Video icon)
  6. Classroom Themes (Palette icon)
  7. Slide Navigation (ChevronRight icon)
  8. Document Teaching (FileText icon)

### Slide 3 -- Real-Time Interaction
- 5 feature cards:
  1. Live Pulse Check -- student taps Got it/Lost, teacher sees bar chart
  2. Confusion Alert -- auto-warning when class is struggling
  3. Anonymous Question Wall -- ask, upvote, pin, filter
  4. AI Concept Checks -- timed MCQs with live results
  5. Spotlight Sync -- teacher controls what students see

### Slide 4 -- AI Live Notes
- 6 feature cards:
  1. Auto Note Generation -- AI creates notes per slide
  2. Teacher Notes Dashboard -- progress tracking
  3. Student Notes Drawer -- pull-out with new-note alerts
  4. Key Terms Extraction -- definitions sidebar
  5. Post-Session Review -- complete notes after class
  6. LaTeX/Markdown Support -- formatted equations and content

### Slide 5 -- AI Study Tools
- 9 feature cards in 3x3 grid:
  1. AI Flashcards (Layers)
  2. AI Quiz Generator (FileQuestion)
  3. AI Summarizer (FileText)
  4. Mind Maps (Network)
  5. Lecture Notes (Mic)
  6. AI Podcast (Headphones)
  7. Homework Help (Brain)
  8. PDF Chat (MessageSquare)
  9. Classroom Hub (School)

### Slide 6 -- Analytics and CTA
- 4 analytics cards:
  1. Teacher Intelligence Report
  2. Student Performance Card
  3. Engagement Heatmap
  4. Institution Dashboard
- CTA section with gradient border
- "Let's make every smart board a Classroom Operating System"
- Button: "Get Started" linking to `/auth`

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `src/pages/PitchDeck.tsx` | 6-slide pitch deck with all existing features |
| Modify | `src/App.tsx` | Add lazy import + route |
| Modify | `src/lib/prefetchRoutes.ts` | Add prefetch entry |

