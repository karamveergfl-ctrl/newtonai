## Goal

Produce a single PowerPoint file (`/mnt/documents/newtonai-pitch.pptx`) that mirrors the `/pitch` route — same 19 slides in the same order — with each tool slide's MP4 demo embedded directly inside the file so it plays in PowerPoint without an internet connection.

## Slide list (matches `src/pitch/slides/index.ts`)

```
01  The AI-Powered Classroom        (hero, dark)
02  The Challenge                   (problem statements)
03  The Solution                    (3 pillars)
04  Student Tools                   (section divider)
05  AI Quiz Generator               + quiz.mp4
06  AI Flashcards                   + flashcards.mp4
07  AI Podcast — Two AI Friends     + podcast.mp4
08  Newton Chat — AI Tutor          + newtonchat.mp4
09  Ad-Free Educational Videos      + videowithout_ads.mp4
10  AI Summariser                   + summary.mp4
11  Homework Help                   + homework_help.mp4
12  PDF Chat                        + chat_pdf.mp4
13  AI Mind Maps                    + mindmap.mp4
14  Student Dashboard
15  Teacher & Classroom Tools       (section divider)
16  Class Materials → Student Dashboard + smart_classroom.mp4
17  Animation Videos on Smart Board (no MP4 available)
18  In-Class Quiz + Auto-Attendance (no MP4 available)
19  Teacher Dashboard
20  Get Started                     (CTA, dark)
```

## Visual design (carries the /pitch identity into PowerPoint)

- Palette from `PITCH_COLORS`: deep navy `#0A1628` background for hero/CTA/section dividers, light gradient `#FAFBFF → #EEF2FF → #F3F0FF` for content slides, indigo primary `#6366F1` accent, amber `#F59E0B` highlight.
- Typography: Plus Jakarta Sans for titles (54–60pt bold), Inter/Calibri body (20–24pt).
- Tool slides use a 2-column layout: left column = title, one-line value prop, 3 short bullet benefits; right column = the embedded video framed in a rounded indigo border with a small "Live Demo" pill above it.
- Section dividers (Student Tools / Teacher Tools / CTA) are full-bleed dark with a big number and a one-line tagline.
- Footer on every content slide: "NewtonAI · newtonai.site" + slide number, indigo accent bar on the left edge.

## Video embedding strategy

- Download each MP4 from the public `pitch-videos` bucket (`https://tdvsxaxmwmhpvsdpvbvc.supabase.co/storage/v1/object/public/pitch-videos/...`) into `/tmp/pitch-videos/`.
- For every tool slide that has a URL in `VIDEO_PATHS`, capture a JPEG poster frame at ~1.5 s with `ffmpeg` to use as the slide thumbnail.
- Use `pptxgenjs` `slide.addMedia({ type: 'video', data: 'data:video/mp4;base64,...', cover: posterBase64, x, y, w, h })` so the MP4 is embedded inside the .pptx (no external link). PowerPoint will play it inline on click.
- Expected output size: ~150–300 MB depending on the bucket video sizes. We will report the final size in the delivery message.

## Implementation steps

1. Write `/tmp/build-pitch-pptx.mjs` (Node + `pptxgenjs`).
2. Define an array mirroring `SLIDES` with: title, subtitle, bullets, theme (`dark`/`light`), optional `videoKey` from `VIDEO_PATHS`.
3. Fetch + cache each unique MP4 to `/tmp/pitch-videos/`. Generate poster JPEGs with `ffmpeg`.
4. Render slides via shared helpers (`renderDarkSlide`, `renderToolSlide`, `renderSectionDivider`, `renderDashboardSlide`).
5. Save to `/mnt/documents/newtonai-pitch.pptx`.

## QA (mandatory)

1. Convert the .pptx to PDF with LibreOffice and to per-slide JPEGs with `pdftoppm`.
2. Inspect every slide image for: overlapping text, clipped titles, broken posters, missing footers, wrong colors, low-contrast text on the dark slides, and out-of-order content.
3. Re-open the .pptx file header to confirm each embedded MP4 is present (`unzip -l` should list `ppt/media/media*.mp4` entries equal to the number of unique videos).
4. Fix any issues, re-render only the affected slides, repeat until a full pass is clean.
5. Report the final file size and an explicit summary of issues found + fixes.

## Deliverable

`/mnt/documents/newtonai-pitch.pptx` surfaced via a `<presentation-artifact>` tag so you can download it directly from chat.
