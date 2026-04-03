

# Walk-in Mode, Voice Commands, Confusion Alert & Teacher Report — Implementation Plan

## Current State

| Feature | Status | Gap |
|---------|--------|-----|
| **Walk-in Mode** | Missing entirely | No session restore banner on classroom open |
| **Voice Commands** | Working but requires "Newton" prefix | Missing: direct commands (pen, eraser, colors, clear board, new page), toast feedback for unrecognized commands |
| **Confusion Alert** | Partial — fires in PulseMeter sidebar only | No full-width top banner in SmartBoardPanel, no "Recap Now" AI button, no warning vs critical distinction, no audio chime |
| **Teacher Intelligence Report** | Working — has heatmap, topics, concept checks, PDF export | Missing: Recharts-based timeline chart (currently grid tiles), confusion spike annotations on timeline, peak/average student counts in summary |

## Plan — 4 Changes

### 1. Walk-in Mode Banner

Create `src/components/smartboard/WalkInBanner.tsx`:
- On `SmartBoardPanel` mount, query `live_sessions` for the most recent `status='ended'` session for the same `class_id`
- If found, show a banner: class name, last session date, "Continue from last session?" with **Yes** / **Start Fresh** buttons
- "Yes" loads `whiteboard_data` JSON from that session record onto the canvas via `whiteboardRef.current`
- "Start Fresh" dismisses the banner
- Auto-dismiss after 8 seconds via `setTimeout`
- Wire into `SmartBoardPanelInner` — show above the main content area, only on initial mount

### 2. Voice Commands Expansion

Modify `src/hooks/useVoiceCommands.ts`:
- Remove the "Newton" prefix requirement — listen for direct commands
- Add new command types: `"pen"`, `"eraser"`, `"text"`, `"clear_board"`, `"new_page"`, `"undo"`, and color commands (`"red"`, `"blue"`, `"green"`, `"black"`, `"yellow"`)
- Add callbacks to props: `onToolChange`, `onColorChange`, `onNewPage`, `onUndo`, `onClearBoard`
- For unrecognized speech: show a toast with suggestions ("Try: 'next slide', 'start recording', 'pen', 'red'")
- Show animated command toast for every recognized command

Wire new callbacks in `SmartBoardPanel.tsx` connecting voice commands to whiteboard state (`wb.setTool`, `wb.setColor`, etc.)

### 3. Confusion Alert Full Banner

Create `src/components/smartboard/ConfusionAlertBanner.tsx`:
- Receives `confusionPercentage`, `threshold`, `slideContent`, `sessionId` props
- **Warning** (>30% confused): amber banner: "⚠ X% of students are struggling — consider slowing down"
- **Critical** (>50% lost): red banner with soft audio chime (use `AudioContext` oscillator, 440Hz, 200ms)
- "Dismiss" button and "Recap Now" button
- "Recap Now" calls `newton-chat` edge function with last OCR text to stream a 3-bullet recap in a small popover
- Auto-dismiss after 30s with countdown progress bar

Wire into `SmartBoardPanel.tsx` as a fixed top banner (above canvas area), using `confusionAlert` and `pulseSummary` from `useLivePulse` (need to add the hook to SmartBoardPanel — currently only used inside PulseMeter).

### 4. Teacher Report — Recharts Timeline

Modify `src/components/intelligence-report/EngagementHeatmap.tsx`:
- Replace the grid tile layout with a Recharts `AreaChart` + `Tooltip`
- X-axis: slide index (or timestamp if available)
- Y-axis: engagement score (0-100)
- Gradient fill: green at top, red at bottom using `linearGradient` defs
- Tooltip on hover shows: slide title, engagement score, pulse responses, questions asked
- Keep the color legend
- Automatically label peak engagement and confusion spike slides with `ReferenceDot` annotations

Add `peak_students` and `average_students` fields to the session summary card in `TeacherReportPage.tsx` (data already available from the edge function, just not displayed).

## Files Changed

| File | Action |
|------|--------|
| `src/components/smartboard/WalkInBanner.tsx` | Create |
| `src/components/smartboard/ConfusionAlertBanner.tsx` | Create |
| `src/hooks/useVoiceCommands.ts` | Modify — remove Newton prefix, add tool/color/page commands |
| `src/components/live-session/SmartBoardPanel.tsx` | Modify — wire walk-in banner, confusion banner, expanded voice callbacks |
| `src/components/intelligence-report/EngagementHeatmap.tsx` | Modify — replace tile grid with Recharts AreaChart |

No database migrations needed — all data uses existing `live_sessions` and `session_intelligence_reports` tables.

