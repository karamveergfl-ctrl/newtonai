

# Revamp Pitch Deck for Dean -- 8 Slides + PPT/PDF Download

## Overview
Rewrite `PitchDeck.tsx` with 8 dean-focused slides that highlight every existing NewtonAI feature (especially visual learning tools like embedded video search, AI podcasts, mind maps, etc.), and add download buttons for both PPTX and PDF versions.

## Slide Content (8 Slides)

### Slide 1 -- Title Slide
- "NewtonAI -- AI Classroom OS for Smart Boards"
- "Proposed for [University Name] -- Pilot Program"
- Tagline: "One screen. One system. Complete classroom workflow."
- Audience: Deans, Principals, HODs
- Three highlight stats: 15+ AI Tools / Real-Time Interaction / Institutional Analytics

### Slide 2 -- The Problem Today
- Smart boards used as fancy PDF viewers
- Faculty juggling Excel, WhatsApp, paper registers
- Students have no single view of marks, attendance, progress
- Admin has no real-time visibility into teaching quality or failure rates
- Icon grid showing pain points: scattered tools, manual processes, zero analytics

### Slide 3 -- Smart Board as Classroom OS
- Walk-in mode: teacher arrives, board auto-loads class content
- Digital whiteboard with pen, highlighter, colors, undo/redo
- Handwriting recognition: board strokes become digital text
- Voice commands: "next slide", "start recording"
- Lecture recording with REC indicator
- Document teaching: teach from PDFs directly on board
- Classroom themes for projector/smart board optimization

### Slide 4 -- Instant Visual Learning (Key Differentiator)
- **Embedded Video Search**: Select any text on board/PDF, instantly find and play educational YouTube videos right inside the platform -- no tab switching
- **AI Mind Maps**: Auto-generate visual concept maps from any content
- **AI Podcast**: Convert any document/chapter into audio -- students learn while commuting
- **Handwriting OCR**: Take a photo of handwritten notes, AI extracts and digitizes
- **LaTeX and Equation Rendering**: Complex math displayed beautifully
- Highlight: "One tap on any topic = instant animated explainer video"

### Slide 5 -- Real-Time Student-Teacher Interaction
- Live Pulse: students tap "Got it / Slightly lost / Lost", teacher sees live bar chart
- Confusion Alert: auto-warning when too many students are lost
- Anonymous Question Wall: ask, upvote, pin, filter (All/Unanswered/Pinned)
- AI Concept Checks: timed MCQs mid-lecture with live results
- Spotlight Sync: teacher pushes content to all student screens

### Slide 6 -- AI-Powered Notes and Study Tools
- Auto note generation per slide during live class
- Student notes drawer with new-note badge
- Key terms extraction and definitions
- Post-session review with complete notes
- AI Flashcards, Quiz Generator, Summarizer
- Homework Help with step-by-step solutions
- PDF Chat: Q&A with any document

### Slide 7 -- Institution Dashboard and Analytics
- Teacher Intelligence Report: session summary, engagement heatmap, PDF export
- Student Performance Card: understanding score, knowledge gaps, weak topics
- Department management and faculty monitoring
- Compliance and audit trails
- Result processing: gradebook, rank lists, report cards
- Academic records management
- Red flag alerts for high failure-rate courses

### Slide 8 -- Impact and Next Steps + CTA
- Benefits for Faculty: no more juggling apps, AI-assisted teaching
- Benefits for Students: transparent progress, interactive learning, personal AI tutor
- Benefits for Administration: clean data for NAAC/NBA, early risk detection
- Pilot Proposal: "2-3 departments this semester"
- CTA: "Let's make every smart board a Classroom Operating System"
- "Get Started" button linking to /auth

## Download Functionality

### PDF Download (using existing jsPDF)
- Generate a multi-page A4 landscape PDF
- Each slide becomes one page with title, subtitle, and feature bullet points
- Dark blue/slate color scheme matching the on-screen deck
- Download button in the bottom control bar

### PPTX Download (using pptxgenjs)
- Install `pptxgenjs` package (lightweight, no backend needed)
- Generate 8-slide PowerPoint file client-side
- Each slide: dark gradient background, white text, structured layout
- Feature cards as bullet points with titles and descriptions
- Download button next to PDF button

## Technical Details

### Modified File: `src/pages/PitchDeck.tsx`
- Complete rewrite with 8 slides (up from 6)
- Update `TOTAL_SLIDES` to 8
- New slide data arrays reorganized for dean audience
- Slide 2 (Problem) is new -- icon grid showing current pain points
- Slide 4 (Visual Learning) is new -- highlights video search, mind maps, podcasts
- Slide 7 (Institution) is expanded with compliance, result processing, academic records
- Add two download buttons (PDF, PPTX) in bottom controls bar
- `generatePDF()` function using jsPDF (already installed)
- `generatePPTX()` function using pptxgenjs (new dependency)

### New Dependency
- `pptxgenjs` -- client-side PowerPoint generation (no server needed)

### Navigation Updates
- All keyboard/scroll/touch handlers remain identical
- Dot indicators update to 8 dots
- Progress bar adjusts to 8 slides

### Download Button UI
- Two new icon buttons in the bottom-right control bar
- FileText icon for PDF, FileDown icon for PPTX
- Both generate and trigger browser download immediately

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/pages/PitchDeck.tsx` | Rewrite with 8 dean-focused slides + PDF/PPTX download |

One new dependency: `pptxgenjs`

