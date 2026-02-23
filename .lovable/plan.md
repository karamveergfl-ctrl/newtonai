
# Add PPT/PPTX Text Extraction Support

## Overview
PPT/PPTX files (like DOCX) are ZIP archives containing XML. We'll create a new edge function to extract text from them and wire it into the existing `processUploadedFile` utility.

## Changes

### 1. New Edge Function: `supabase/functions/extract-pptx-text/index.ts`
- Same pattern as `extract-docx-text`: auth check, base64 input, JSZip to unzip
- PPTX stores slides in `ppt/slide1.xml`, `ppt/slide2.xml`, etc.
- Parse each slide XML to extract text from `<a:t>` tags (the text run elements in PowerPoint XML)
- Group text by slide with "Slide N" headers for structure
- Max file size: 20MB (same as DOCX)

### 2. Update `src/utils/contentProcessing.ts`
- Add `extractTextFromPPTX` function (mirrors `extractTextFromDOCX`, calls `extract-pptx-text`)
- Add PPT/PPTX detection in `processUploadedFile`:
  - MIME types: `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.ms-powerpoint`
  - File extensions: `.pptx`, `.ppt`

### 3. Update `supabase/config.toml`
- Not needed -- config.toml is auto-managed

### Technical Details

**PPTX XML structure:**
- Slides live at `ppt/slide1.xml`, `ppt/slide2.xml`, ...
- Text content is in `<a:t>` elements inside `<a:r>` (run) elements inside `<a:p>` (paragraph) elements
- We'll iterate all `ppt/slideN.xml` files in order and extract text paragraphs

**Edge function approach:**
```
1. Receive base64 PPTX content
2. Decode and load with JSZip
3. Find all ppt/slide*.xml files, sort numerically
4. For each slide, regex-extract <a:t> text nodes
5. Join paragraphs, prefix with "## Slide N"
6. Return concatenated text
```

### Files Modified/Created
| File | Action |
|------|--------|
| `supabase/functions/extract-pptx-text/index.ts` | Create -- new edge function |
| `src/utils/contentProcessing.ts` | Edit -- add PPTX extraction + detection |
