
# Plan: Fix Mobile Text Selection Tools Across All Pages

## Overview
The text selection tools are not appearing on mobile devices across multiple components. This plan addresses all affected areas to ensure consistent mobile support for study tools.

## Problem Analysis
After exploring the codebase, I identified several issues:

1. **PDFChatSplitView (PDF Chat page)**: Uses a simplified `TextSelectionToolbar` from `pdf-chat/` folder that only has "Ask" and "Explain" buttons - no full study tools and no mobile drawer
2. **MobileTextSelectionDrawer**: Still shows "Notes" label instead of "Summary"
3. **PDFViewerWithHighlight**: Only handles `mouseUp` for text selection, missing `touchEnd` support
4. **Inconsistent toolbar components**: Different pages use different selection toolbars with varying features

## Implementation Tasks

### Task 1: Update MobileTextSelectionDrawer Label
**File**: `src/components/MobileTextSelectionDrawer.tsx`

Change "Notes" to "Summary" on line 200 to match the updated naming convention used elsewhere.

---

### Task 2: Add Mobile Touch Support to PDFViewerWithHighlight
**File**: `src/components/pdf-chat/PDFViewerWithHighlight.tsx`

Add `onTouchEnd` event listener alongside `onMouseUp` for the text selection handler:
- Add `onTouchEnd={handleTextSelection}` to the container div (line 363)
- This ensures text selection triggers on mobile touch devices

---

### Task 3: Create Mobile Selection Support for PDFChatSplitView
**File**: `src/components/pdf-chat/PDFChatSplitView.tsx`

Currently, the PDF Chat page uses a simplified `TextSelectionToolbar` from the `pdf-chat/` folder that only has "Ask" and "Explain" buttons. On mobile, we need to:

1. Import the `MobileTextSelectionDrawer` from the main components folder
2. Import `useIsMobile` hook
3. Add state for `showMobileDrawer`
4. Show the main `TextSelectionToolbar` (with full study tools) on desktop
5. Show `MobileTextSelectionDrawer` on mobile
6. Connect the drawer to study tool generation functions

Changes required:
- Add imports for `MobileTextSelectionDrawer` and the main `TextSelectionToolbar` 
- Add mobile drawer state management
- Render different toolbars based on device type
- Wire up video search and study tool callbacks

---

### Task 4: Update PDF Chat TextSelectionToolbar or Replace It
**Option A (Recommended)**: Replace the simplified toolbar with the main one

The `src/components/pdf-chat/TextSelectionToolbar.tsx` is a simplified version with only "Ask" and "Explain" buttons. We should:
- Use the main `src/components/TextSelectionToolbar.tsx` instead
- This provides full study tools (Videos, Quiz, Flashcards, Summary, Mind Map)
- Keeps "Ask" and "Explain" as additional PDF-specific actions

**Option B**: Extend the existing PDF Chat toolbar
- Add video search and study tool buttons
- Add mobile drawer integration
- More code duplication

I recommend **Option A** for consistency, but we'll need to keep the Ask/Explain functionality specific to PDF Chat by adding those handlers.

---

### Task 5: Wire Up Study Tool Generation in PDFChatSplitView
**File**: `src/components/pdf-chat/PDFChatSplitView.tsx`

Add handlers for:
- Video search from selected text
- Quiz generation from selected text
- Flashcards generation from selected text
- Summary generation from selected text  
- Mind Map generation from selected text

These will use the existing `usePDFStudyTools` hook but with the selected text as input.

---

## Technical Details

### PDFChatSplitView Changes (Main Work)

```text
Current mobile rendering (simplified, no study tools):
┌─────────────────────────┐
│  TextSelectionToolbar   │  ← Only Ask/Explain
│  (pdf-chat version)     │
└─────────────────────────┘

Proposed mobile rendering (full feature):
┌─────────────────────────┐
│ MobileTextSelectionDrawer│  ← Full study tools
│ - Videos                 │
│ - Quiz                   │
│ - Flashcards             │
│ - Summary                │
│ - Mind Map               │
│ + PDF-specific actions   │
└─────────────────────────┘
```

### Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/MobileTextSelectionDrawer.tsx` | Label fix | Change "Notes" to "Summary" |
| `src/components/pdf-chat/PDFViewerWithHighlight.tsx` | Add touch support | Add `onTouchEnd` handler |
| `src/components/pdf-chat/PDFChatSplitView.tsx` | Major update | Add mobile drawer, wire up study tools |

### Dependencies
- No new dependencies required
- Uses existing components: `MobileTextSelectionDrawer`, `TextSelectionToolbar`
- Uses existing hooks: `usePDFStudyTools`, `useIsMobile`

## Testing Checklist
- [ ] Verify text selection works on mobile devices for PDF Chat
- [ ] Verify drawer appears with all study tool options
- [ ] Verify "Summary" label shows instead of "Notes" everywhere
- [ ] Verify video search works from selected text
- [ ] Verify study tool generation works from selected text
- [ ] Verify desktop behavior remains unchanged
