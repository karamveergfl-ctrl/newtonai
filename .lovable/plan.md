

# Make PDF and PPTX Exports Pixel-Perfect Screenshots

## Problem
- The **PDF** export clones slides off-screen, which can lose some CSS styles (gradients, backdrop-blur, animations)
- The **PPTX** export uses plain text bullets -- looks nothing like the on-screen presentation

## Solution
Both exports will capture the **actual visible slides** as high-resolution screenshots using `html2canvas`, then embed the images into the PDF/PPTX files.

## How It Works

1. When user clicks Download (PDF or PPTX):
   - Temporarily navigate through each of the 8 slides (showing each one on screen)
   - Capture each slide using `html2canvas` at 2x resolution
   - Store all 8 captured images
   - Restore the user's original slide position
   - Build the PDF or PPTX from the captured images

2. **PDF**: Each captured image becomes a full-bleed landscape page via `jsPDF`
3. **PPTX**: Each captured image is added as a full-slide background image via `pptxgenjs` (it supports base64 image data)

## Technical Changes

### File: `src/pages/PitchDeck.tsx`

- **New shared function** `captureAllSlides()`:
  - Saves current slide index
  - For each slide (0-7): sets `current` to that index, waits for render, captures with `html2canvas`
  - Returns array of 8 base64 image strings
  - Restores original slide

- **Replace `generatePDF()`**: Use captured images instead of cloning DOM nodes off-screen

- **Replace `generatePPTX()`**: Instead of text bullets, add each captured image as a full-slide image using `pptx.addImage()` with base64 data

- **Add generating states** for both buttons (loading spinners during capture)

- The capture function will target the actual slide container element on screen (the `[data-slide-index]` div), ensuring exact visual fidelity including all gradients, fonts, colors, and icons

