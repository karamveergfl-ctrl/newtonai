

# Fix PDF Download & Remove Newton Chat from Pitch Deck

## Changes

### 1. PDF Download: Screenshot-Quality Export (Match On-Screen Presentation)

The current PDF uses `jsPDF` text-only output (plain bullets on a dark background). To make the PDF look identical to the on-screen slides, we will use `html2canvas` (already installed) to capture each slide as a high-resolution image and place it into a landscape PDF page.

**How it works:**
- When "Download PDF" is clicked, temporarily render all 8 slides in a hidden off-screen container (visible but off-viewport, since `html2canvas` needs rendered DOM)
- Capture each slide as a canvas using `html2canvas` at 2x scale for sharpness
- Insert each canvas image into a landscape A4 `jsPDF` page
- Download the resulting PDF -- every slide looks pixel-identical to the presentation

**File modified:** `src/pages/PitchDeck.tsx`
- Replace the `generatePDF()` function with a new version that:
  - Creates an off-screen container with all 8 slides at fixed 1280x720 dimensions
  - Uses `html2canvas` to capture each slide div
  - Adds each as an image to jsPDF landscape pages
  - Cleans up the temporary container
  - Shows a loading state on the download button while generating

### 2. Remove Newton Chat from Pitch Deck Route

**File modified:** `src/components/GlobalNewtonAssistant.tsx`
- Add a check: if `location.pathname === "/pitch-deck"`, return `null` (render nothing)
- This hides both the floating trigger button and the chat panel on the pitch deck

**File modified:** `src/components/MobileBottomNav.tsx`
- Also hide the mobile bottom nav (which includes Newton chat) on `/pitch-deck` if it doesn't already

---

## Technical Details

### PDF Generation Approach
```text
1. Create hidden container (position: fixed, left: -9999px)
2. For each of the 8 slides:
   a. Render slide component into a 1280x720 div
   b. Call html2canvas(div, { scale: 2, backgroundColor: null })
   c. Convert canvas to JPEG data URL
   d. Add to jsPDF page (landscape A4, full bleed)
3. Remove hidden container
4. Save PDF
```

- Uses `html2canvas` which is already in the project dependencies
- 2x scale ensures crisp text on retina displays
- JPEG format keeps file size reasonable (vs PNG)
- Each slide rendered at 1280x720 to match 16:9 aspect ratio

### Newton Chat Hiding
- Single line addition in `GlobalNewtonAssistant.tsx`: early return when on `/pitch-deck`
- Also check `MobileBottomNav.tsx` for the same route exclusion

## Files Summary

| Action | File | Change |
|--------|------|--------|
| Modify | `src/pages/PitchDeck.tsx` | Replace `generatePDF()` with html2canvas-based screenshot capture |
| Modify | `src/components/GlobalNewtonAssistant.tsx` | Hide on `/pitch-deck` route |
| Modify | `src/components/MobileBottomNav.tsx` | Hide on `/pitch-deck` route |
