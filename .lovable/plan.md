# Pitch Deck v2 — Restructure & Polish

## New slide order (16 slides total)

```text
01  Hero
02  The Challenge          (rebuilt, more interactive + detailed)
03  The Solution           (rebuilt, more interactive + detailed)
--- STUDENT TOOLS ---
04  Video Search
05  AI Flashcards
06  AI Podcast             (re-pitched as "two AI friends teaching you")
07  Newton Chat            (moved to 4th in students block)
08  AI Quiz Generator
09  AI Summariser
10  Homework Help          (rewritten: hardest engineering Qs, camera + PDF screenshot)
11  PDF Chat
12  AI Mind Maps
--- TEACHER TOOLS ---
13  Smart Classroom        (rebuilt: instant animation videos from PDF/notes on smart board)
14  In-Class Quiz + Auto-Attendance + Per-student analysis
15  Teacher Dashboard      (mirrors real app TeacherDashboard, scaled-up data)
--- DASHBOARDS / CLOSE ---
16  Student Dashboard      (mirrors real app StudentPerformance, scaled-up data)
17  Get Started CTA
```

Removed: old Slide 09 Auto Notes, old Slide 06 Live Pulse Meter, old Slide 17 Pricing.

## Per-item changes

**(1) Remove Pricing (old Slide 17)** — delete `Slide17Pricing.tsx`, drop from `slides/index.ts`.

**(2) Fix tool-slide layout (video clipping + spacing/fonts)**
In `ToolSlideLayout.tsx`:
- Top row 45% → 42%, bottom row 55% → 58%.
- Reduce top padding (`pt-20` → `pt-14`), tighten heading size (`clamp(28px,3.5vw,46px)` → `clamp(24px,2.8vw,38px)`), problem/solution body to 13px line-height 1.5.
- Bottom panel: `pt-6 pb-16` → `pt-4 pb-20` (leave room for BottomNav), `min-h-0` chain fixed so `VideoPlayer` parent has explicit `flex: 1` and `max-h-full`.
- `VideoPlayer` gets `max-h-full w-auto aspect-video` instead of fixed sizing so the frame is fully visible inside the white panel above the nav bar.

**(3) Add real video upload per tool**
- New `src/pitch/hooks/useToolVideos.ts`: persists a `{ [toolKey]: objectURL }` map. Files chosen via hidden `<input type="file" accept="video/*">` are stored in IndexedDB (idb-keyval style via a tiny wrapper using `indexedDB` directly — no new dep) and re-hydrated to blob URLs on mount.
- `VideoPlayer` accepts new optional `toolKey` prop. When no `src` and no uploaded blob: show placeholder with an **"Upload demo video"** button (presenter-only affordance) that opens the file picker. Once uploaded, the video plays; an "Replace" pill appears in the corner.
- Works offline at the venue (IndexedDB).

**(4) Slide 15 Teacher Dashboard — mirror the real app**
- Read `src/pages/teacher/TeacherDashboard.tsx` and reproduce its real layout (header, class cards, student counts, recent activity, analytics tiles) inside a `SlideShell theme="light"`.
- Hard-coded "demo institution" data: ~12 classes, 480 students, multiple subjects, realistic recent-activity feed, top-performers list, attendance % per class. No backend calls.
- Replaces the current bar-chart/heatmap-only Slide 16.

**(5) Slide 06 AI Podcast — friend-style dual-AI tutor**
- Rebuild Slide06 (new Podcast slide) with: animated waveform between two AI avatars ("Host" + "Co-host"), live captions cycling through a sample conversation ("Hey, want to break down photosynthesis like we're chilling?"), a "Student" bubble interjecting a doubt that the hosts answer.
- Highlights: casual friend tone, any topic, answers student doubts mid-podcast, generated in seconds.

**(6) Slide 10 Homework Help — rewrite**
- Copy: "From Class 6 arithmetic to JEE Advanced and B.Tech final-year problems — Newton solves it."
- Visual: split panel showing (left) phone camera capturing a handwritten engineering circuit/integral problem, (right) PDF viewer with a screenshot-crop overlay. Arrow flows into a worked step-by-step solution card.
- Highlights: snap a photo, screenshot directly from any PDF, step-by-step with concepts cited.

**(7)(8) Remove** `Slide09AutoNotes.tsx` and `Slide06PulseMeter.tsx` + their imports in `slides/index.ts`. Also delete `PulseMeterDemo.tsx` (unused after removal).

**(9)(10)(11) Reorder + new teacher slides**
- `slides/index.ts` reordered as above.
- **Slide 13 Smart Classroom** rebuilt: hero mock of a smart board showing an auto-generated animated explainer (looping SVG/CSS animation of e.g. a beating heart or planetary orbit) sourced "from PDF page 47 + teacher's notes". Caption: "Teacher types a topic → instant animated video on the board in 8 seconds."
- **Slide 14 In-Class Quiz + Auto-Attendance** (new): timeline graphic — `0–40 min teach → 40–45 min Newton generates quiz from exact pages taught → 45–50 min students answer on phones → submission auto-marks attendance → results dashboard`. Right side: per-student performance bars + "Topics to revisit next class" list aggregated from class-wide misses.

**(12) Slides 02 & 03 — more interactive & detailed**
- Slide 02 Problem: replace static text with three animated stat cards counting up ("1 teacher : 60 students", "₹0 personal tutoring budget", "73% material forgotten in 7 days"), plus a side-by-side "before Newton" classroom illustration with pain points pinned on it.
- Slide 03 Solution: animated diagram — central Newton logo with 9 student-tool nodes orbiting on one side and 3 teacher-tool nodes on the other, connecting lines drawing in on mount. Below: three pillars (For Students / For Teachers / For Institution) each with 3 bullet outcomes.

**(13) Slide 16 Student Dashboard** (new, after Teacher Dashboard)
- Read `src/pages/student/StudentPerformance.tsx` and reproduce its UI inside `SlideShell theme="light"`.
- Hard-coded demo student: 8 enrolled classes/subjects, 24 assignments, attendance 92%, average score 87%, class rank #3 of 58, per-class breakdown cards with marks + grade + attendance progress bars.

## Technical notes

- All work is inside `src/pitch/**`. No changes to app routes, auth, sidebar, or backend.
- No new npm dependencies. IndexedDB accessed directly via a ~40-line wrapper in `src/pitch/lib/videoStore.ts`.
- Plus Jakarta Sans font and `PITCH_COLORS` tokens unchanged.
- `BottomNav` slide counter auto-updates from `SLIDES.length`.

## Files

Create: `Slide13SmartClassroomV2.tsx` (replaces old), `Slide14InClassQuiz.tsx`, `Slide15TeacherDashboard.tsx`, `Slide16StudentDashboard.tsx`, `src/pitch/hooks/useToolVideos.ts`, `src/pitch/lib/videoStore.ts`.

Rewrite: `Slide02Problem.tsx`, `Slide03Solution.tsx`, `Slide06` (now Podcast — rename old `Slide15Podcast.tsx` content into new slot), `Slide10` (Homework Help rewrite), `ToolSlideLayout.tsx`, `VideoPlayer.tsx`, `slides/index.ts`.

Delete: `Slide17Pricing.tsx`, old `Slide09AutoNotes.tsx`, old `Slide06PulseMeter.tsx`, `PulseMeterDemo.tsx`, old `Slide16Analytics.tsx` (replaced by Teacher Dashboard).

Renumber: old `Slide18CTA.tsx` becomes the final slide (now slide 17).
