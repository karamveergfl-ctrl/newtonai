
# Fix Background Transparency in Video Notes Tool

## Problem

The content area in `FullScreenStudyTool.tsx` still has a semi-transparent background (`bg-muted/30` on line 152), which allows the underlying video content to show through.

## Solution

Change the content area background from `bg-muted/30` (30% opacity) to a solid `bg-muted` (100% opacity).

## Implementation

### File: `src/components/FullScreenStudyTool.tsx`

**Line 152** - Change:
```tsx
// FROM:
<div className="p-4 md:p-8 bg-muted/30 min-h-full">

// TO:
<div className="p-4 md:p-8 bg-muted min-h-full">
```

## Summary

| Location | Current | Fixed |
|----------|---------|-------|
| Line 152 | `bg-muted/30` (semi-transparent) | `bg-muted` (solid) |

This ensures the entire fullscreen study tool has a solid, opaque background throughout.
