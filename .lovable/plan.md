
## Goals

1. All tool demo slides become a clean **3-column layout: Problem (left) · Video (center) · Solution (right)** — nothing else.
2. Remove all motion/animations on tool slides; pure static layout to eliminate jitter & overlap.
3. Fix text + video frame overlap (video sized to fit center column, no absolute overflow).
4. Restyle **Slide 3 (Solution)** to match the same dark theme + typography system as the other slides.
5. **Remove the "Instant Video Search" slide** (currently slide 4 in the deck) and replace it with a new student-focused slide: **"Ad-Free Educational Videos — Watch Any Topic, No Ads, No Distractions"** (no teacher in-class framing).

## Changes

### A. `src/pitch/slides/ToolSlideLayout.tsx` — full rewrite
Replace current header + 2-col + video-band structure with a single 3-column grid:

```text
┌─────────────────────────────────────────────────────────────┐
│  Header strip: category chip · tool name · icon (compact)   │
├──────────────┬──────────────────────────┬───────────────────┤
│  PROBLEM     │      VIDEO (16:9)        │   SOLUTION        │
│  (left col)  │      centered, fits      │   (right col)     │
│              │      column height       │   + 3 highlights  │
└──────────────┴──────────────────────────┴───────────────────┘
```

- Grid: `grid-cols-[1fr_1.2fr_1fr] gap-8 px-12`, columns vertically centered.
- Video container: `width: 100%; max-width: 520px; aspect-ratio: 16/9` — never exceeds column.
- Remove all `motion.*` wrappers, `variants`, `framer-motion` import. Plain `div`/`h1`.
- Typography: Plus Jakarta Sans, tool name `clamp(22px, 2vw, 30px)` weight 800; section labels 10px weight 800 uppercase; body 13.5px line-height 1.55.
- Remove "Watch how it works" banner, decorative gradient band, `Play` icon row.
- Problem panel: subtle red-tinted card. Solution panel: subtle green-tinted card with check-bullet highlights underneath.
- Bottom 52px reserved for nav bar (`bottom: 52`).

### B. `src/pitch/components/VideoPlayer.tsx`
- Lower `maxWidth` from 560 → 520, remove the pulsing play-button animation (`pitchPulse` keyframes) and the scanning line keyframes (`pitchScan`).
- Keep upload / play / mute / fullscreen controls. Caption stays under the frame, clamped to column width.
- Empty-state simplified: icon + tool name + Upload button, no animated scan line.

### C. New slide — replace `Slide07VideoSearch`
- Delete file `src/pitch/slides/Slide07VideoSearch.tsx`.
- Add `src/pitch/slides/SlideAdFreeVideos.tsx` using `ToolSlideLayout`:
  - Category: `STUDENT LEARNING`, color `#A855F7`
  - Tool name: `Ad-Free Educational Videos — Any Topic, Zero Distractions`
  - Problem: YouTube buries learning under ads, clickbait recommendations, and 15-second pre-rolls. A student searching "Photosynthesis" wastes 4–5 minutes per video and gets pulled into unrelated content.
  - Solution: Newton lets the student search any topic and instantly plays curriculum-aligned educational videos in a clean, fullscreen, ad-free player — no recommendations, no comments, no algorithm.
  - Highlights: ① Zero ads, zero pre-rolls. ② Curriculum-tagged results only. ③ Saves watch history into Newton Chat so the student can ask follow-up questions.
  - Icon: `PlayCircle` (lucide).
  - `videoKey: "AD_FREE_VIDEOS"`, `videoSrc: VIDEO_PATHS.AD_FREE_VIDEOS` (will add to constants).
- Add `AD_FREE_VIDEOS: ""` entry in `src/pitch/constants/videoPaths.ts`.

### D. `src/pitch/slides/index.ts`
- Remove the `Slide07VideoSearch` import & its entry.
- Import & insert `SlideAdFreeVideos` in the same position (slide 4, first of the student tools group).

### E. `src/pitch/slides/Slide03Solution.tsx` — restyle to match theme
- Adopt the same dark `#0A1628` background, Plus Jakarta Sans typography, category chip pattern, and spacing scale used by the tool slides.
- Replace any current bespoke colors/cards with the standard token palette (`#6366F1` accent, `#F1F5F9` body, `#94A3B8` muted, `#34D399`/`#F87171` for green/red highlights).
- Keep its existing content (the 3-pillar solution narrative) — only typography, colors, and spacing change.
- Remove heavy motion if present; keep at most a single fade.

## Out of scope
- Hero, Problem, Smart Classroom, In-Class Quiz, Teacher Dashboard, Student Dashboard, CTA slides — untouched.
- No backend / data changes. Pure presentational edits inside `src/pitch/`.

Confirm and I'll implement.
