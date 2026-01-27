
# Fix Video Notes Tool UI to Match Slider Tools

## Problem

The "Notes" tool from video tools (second image) displays content in a simple card format with "Key Takeaways" as a basic list. The desired UI (first image) shows a structured, collapsible section layout with:
- "Executive Summary" and numbered sections (1. Learning Objectives, 2. Chapter Breakdown, etc.)
- Expand All / Collapse All buttons
- Download dropdown with multiple format options
- Chevron icons for collapsible sections

## Root Cause

Two different components are used for rendering summaries:

| Tool Page | Component Used | UI Quality |
|-----------|----------------|------------|
| AISummarizer, AILectureNotes | `StudySectionRenderer` | Modern collapsible UI |
| Video Summary (FullScreenStudyTool) | Custom `renderStudyGuide()` | Basic card layout |

The `FullScreenStudyTool` uses `parseSummaryContent` from `NotebookLMStyles.tsx` which only recognizes specific section headers (Overview, Key Topics, Key Takeaways). If content doesn't match, it falls back to plain markdown.

## Solution

Update `FullScreenStudyTool.tsx` to use the `StudySectionRenderer` component for summary/notes content, which provides:
- Collapsible sections with numbered badges
- Expand All / Collapse All buttons
- Multi-format download dropdown (PDF, DOCX, Markdown, Text, PNG)
- Better visual hierarchy with gradient backgrounds
- Consistent styling across all study tools

## Implementation

### File: `src/components/FullScreenStudyTool.tsx`

**1. Add import for StudySectionRenderer (around line 16):**
```tsx
import { StudySectionRenderer } from "./StudySectionRenderer";
```

**2. Remove the custom `renderStudyGuide()` function (lines 154-267)** since we'll use StudySectionRenderer instead.

**3. Update the content rendering section (around line 360-362):**

Current code:
```tsx
{type === "summary" ? (
  renderStudyGuide()
) : (
```

Updated code:
```tsx
{type === "summary" ? (
  <div className="max-w-4xl mx-auto">
    <StudySectionRenderer content={content} type="summary" />
  </div>
) : (
```

**4. Clean up unused imports and functions:**
- Remove `parseSummaryContent`, `nlmColors`, `typography` from NotebookLMStyles import (line 16)
- Keep `nlmColors` only if used elsewhere (header icon background)
- Remove `getSectionIcon` function (lines 141-151) since StudySectionRenderer has its own
- Remove local Table imports if no longer needed

### Detailed Code Changes

**Lines 1-20 - Update imports:**
```tsx
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { X, Download, Loader2, Brain, BookOpen, FileText, Network, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { nlmColors, typography } from "./NotebookLMStyles";
import { StudySectionRenderer } from "./StudySectionRenderer";
```

**Lines 141-267 - Remove renderStudyGuide function and getSectionIcon**

The entire `getSectionIcon` function and `renderStudyGuide` function can be deleted.

**Lines 360-362 - Update summary rendering:**
```tsx
{type === "summary" ? (
  <div className="max-w-4xl mx-auto">
    <StudySectionRenderer content={content} type="summary" />
  </div>
) : (
```

**Line 305-327 - Update header to remove duplicate Download PDF button:**

Since `StudySectionRenderer` has its own download dropdown with multiple formats, we can keep the header simpler or make the Download PDF button conditional (only show for non-summary types).

## Visual Comparison

```text
BEFORE (Video Notes)              AFTER (Video Notes)
+--------------------------+      +--------------------------+
| Study Guide     [PDF] [X]|      | Study Guide         [X]  |
+--------------------------+      +--------------------------+
| Title                    |      | [Download ▼] [Expand All]|
| Study Guide • 1 sections |      |                          |
+--------------------------+      | ┌──────────────────────┐ |
|  [💡] Key Takeaways      |      | │ 📄 Executive Summary ▼│ |
|                          |      | └──────────────────────┘ |
|  - Point 1               |      |                          |
|  - Point 2               |      | ┌──────────────────────┐ |
|  - Point 3               |      | │ [1] Learning Obj.   ▼│ |
|                          |      | └──────────────────────┘ |
+--------------------------+      |                          |
                                  | ┌──────────────────────┐ |
                                  | │ [2] Chapter Break.  ▼│ |
                                  | └──────────────────────┘ |
                                  +--------------------------+
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/FullScreenStudyTool.tsx` | Import `StudySectionRenderer`, remove `renderStudyGuide` function, update summary rendering to use `StudySectionRenderer` |

## Benefits

- Consistent UI across all summary/notes tools
- Collapsible sections save screen space
- Multi-format export (PDF, DOCX, MD, TXT, PNG)
- Better readability with expand/collapse controls
- Shared codebase reduces maintenance
