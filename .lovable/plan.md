

# Redesign Add Material Dialog

## Current Issue
The dialog uses a dropdown to switch between "Link" and "Upload Document" modes, hiding one option when the other is selected. The user wants both options visible simultaneously.

## New Layout

The dialog will have this simplified flow:

1. **Title** input field
2. **Description** (optional) input field
3. **Upload or Link** section side-by-side:
   - Left: A file upload drop zone (click to browse) for PDF/DOCX/PPTX/TXT
   - Right: A URL paste input field
   - Divider text "or" between them
   - When a file is selected, the URL field is disabled (and vice versa)
4. **Add Material** button

## Technical Details

### File Modified
`src/pages/teacher/ClassDetail.tsx` -- the `AddMaterialDialog` component (lines 448-583)

### Changes
- Remove the `Select` dropdown for material type
- Show both the file upload area and the URL input simultaneously, separated by an "or" divider
- Auto-detect material type from what the user provides:
  - If file uploaded: type = "document" or "pdf" based on extension
  - If URL pasted: type = "link" (or "video" if URL contains youtube/vimeo patterns)
- When a file is selected, clear and disable the URL input; when URL is typed, clear and disable the file input
- Keep all existing upload logic (storage bucket, fallback handling)

