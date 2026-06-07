## Pitch Deck Overhaul Plan (/pitch)

### 1. Global light theme
- Switch `PITCH_THEMES.dark` usage across slides → use new **`light`** theme as default.
- Update `src/pitch/constants/videoPaths.ts`:
  - New background: soft gradient `linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 50%, #F5F3FF 100%)`.
  - Text: `#0F172A` (primary), `#475569` (muted).
  - Card surfaces: white with subtle `#E2E8F0` borders + soft indigo glow shadows.
- Update `SlideShell.tsx`: default theme `light`, replace white dotgrid with faint indigo dotgrid (`#6366F1` @ 0.05 opacity).
- Update `PitchPresentation.tsx`: container bg from `#0A1628` → light gradient.
- Update `BottomNav` to light variant (white/blur with dark text).
- Update each slide file (`Slide01Hero`, `Slide02Problem`, `Slide03Solution`, all tool slides, dashboards, CTA) to pass `theme="light"` and swap dark-only color literals (e.g. `#F1F5F9`, `rgba(248,113,113,0.06)`) for light-mode equivalents (darker text, slightly tinted card backgrounds).
- `ToolSlideLayout`: change problem/solution card backgrounds + text colors for light bg; keep red/green accents but adjust opacity for contrast.

### 2. Cite data sources on Slide 2 (and any other data slides)
- Add a "**Sources**" footer strip on `Slide02Problem` listing where each stat comes from. Placeholder citations to use (user can edit later):
  - UNESCO Global Education Monitoring Report 2023
  - NCERT Learning Outcomes Survey 2022
  - McKinsey "How AI can accelerate students' learning" 2024
  - OECD PISA 2022 results
- Render as small `text-[11px]` italic line at bottom with numbered superscripts on the stats themselves.
- Scan other slides with stats (Solution, Dashboards) and add similar inline citations where numbers appear.

### 3. Fix fullscreen overlap issues
- `ToolSlideLayout`: increase top padding from `pt-24` → `pt-28`, ensure header doesn't collide with Logo.
- Reserve fixed bottom space for `BottomNav` (currently 52px) — bump to 64px and ensure video band uses `bottom: 64` not 52.
- Audit `Slide02Problem`, `Slide03Solution` for absolute elements escaping at 16:9; add `max-h` + `overflow-hidden` on stat cards.
- Test by rendering in fullscreen (1920×1080) mentally and adjusting padding/margins.

### 4. Audience tagging on Slide 3 (Solution)
- Rework `Slide03Solution` tool grid: each tool card gets a colored badge:
  - 🎓 **STUDENT** (indigo)
  - 👨‍🏫 **TEACHER** (amber)
  - 📺 **SMARTBOARD / SHARED** (emerald)
- Map current tools:
  - Student: Quiz, Flashcards, Podcast, Newton Chat, Ad-Free Videos, Summariser, Homework Help, PDF Chat, Mind Maps
  - Teacher: In-Class Quiz + Auto-Attendance, Teacher Dashboard
  - Smartboard/Shared: Smart Classroom (Instant Animations)

### 5. Section divider slides
- Create two new slide components:
  - `SlideStudentToolsIntro.tsx` — full-bleed light slide: "🎓 Student Tools" with subtitle "Tools that help students learn faster, retain more, and stay focused."
  - `SlideTeacherToolsIntro.tsx` — "👨‍🏫 Teacher Tools" with subtitle "Tools that save teachers hours and make classrooms interactive."
- Insert in `src/pitch/slides/index.ts` SLIDES array before the respective tool groups.

### 6. Bigger tool titles
- In `ToolSlideLayout.tsx`, the tool name `<h1>` currently `fontSize: 30`. Bump to **48px**, bolder (`fontWeight: 900`), tighter letter-spacing. Also enlarge category kicker from 10px → 13px.
- Increase icon container from 64×64 → 88×88, scale icon `0.68` → `0.85`.
- Adjust header padding so the bigger title still clears the top.

### 7. Student Dashboard placement
- Currently order: …all student tools → teacher tools → **Student Dashboard** → CTA.
- Move `SlideStudentDashboard` to appear **after all student tools but before** `SlideTeacherToolsIntro` (so flow is: Student intro → student tools → student dashboard → Teacher intro → teacher tools → Teacher dashboard → CTA).
- Updated `SLIDES` order:
  1. Hero
  2. Problem
  3. Solution (with audience tags)
  4. **Student Tools Intro** (new)
  5-13. All 9 student tool slides
  14. **Student Dashboard**
  15. **Teacher Tools Intro** (new)
  16. Smart Classroom (shared/smartboard) — keep here as teacher-facing
  17. In-Class Quiz + Auto-Attendance
  18. Teacher Dashboard
  19. CTA

### Files to create
- `src/pitch/slides/SlideStudentToolsIntro.tsx`
- `src/pitch/slides/SlideTeacherToolsIntro.tsx`

### Files to edit
- `src/pitch/constants/videoPaths.ts` — light theme tokens + gradient
- `src/pitch/components/SlideShell.tsx` — default light, light grid pattern
- `src/pitch/components/BottomNav.tsx` — light styling
- `src/pitch/slides/ToolSlideLayout.tsx` — bigger title, light card colors, padding
- `src/pitch/slides/index.ts` — reorder + add 2 new slides
- `src/pages/PitchPresentation.tsx` — light bg
- `src/pitch/slides/Slide01Hero.tsx`, `Slide02Problem.tsx` (add source citations), `Slide03Solution.tsx` (audience tags), `Slide04NewtonChat`, `Slide08QuizGenerator`, `Slide10Flashcards`, `Slide11Summariser`, `Slide12HomeworkHelp`, `Slide13PDFChat`, `Slide14MindMaps`, `Slide15Podcast`, `SlideAdFreeVideos`, `SlideSmartClassroom`, `SlideInClassQuiz`, `SlideStudentDashboard`, `SlideTeacherDashboard`, `Slide18CTA` — light theme color swaps.

### Validation
- Render `/pitch` in preview, step through every slide, fullscreen check (F key) on slides 2, 3, all tool slides, dashboards.
- Verify no text overlap with Logo, BottomNav, or video player.
- Confirm citations are legible but unobtrusive.

Ready to switch to build mode and implement?