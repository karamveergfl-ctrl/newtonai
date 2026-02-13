

# Fix Newton AI Chat Text Clipping When Sidebar Is Open

## Problem

When the sidebar is open on desktop, the chat message text overflows and gets cut off at the right edge of the panel. Closing the sidebar makes text display correctly because the chat panel then has full width. The root cause is missing `min-w-0` on flex children, which prevents them from shrinking below their content's intrinsic minimum width.

## Changes

### File 1: `src/components/GlobalNewtonAssistant.tsx`

Add `min-w-0` to the chat panel wrapper div on desktop (line 176). In a flex layout, children default to `min-width: auto`, which prevents them from shrinking below content size. Adding `min-w-0` allows the `flex-1` container to properly shrink when the sidebar takes up space.

**Line 176**: Change `"flex-1 overflow-hidden"` to `"flex-1 overflow-hidden min-w-0"`

Also apply same fix to the mobile drawer chat wrapper (line 130).

### File 2: `src/components/newton-assistant/NewtonChatPanel.tsx`

Add `min-w-0` to the outermost container so it can shrink within its parent flex context. The current class `"flex flex-col h-full bg-background rounded-2xl border shadow-2xl overflow-hidden"` needs `min-w-0` added.

Also add `min-w-0` to the ScrollArea wrapper to ensure the scroll container properly constrains its children's width.

### File 3: `src/components/newton-assistant/NewtonMessageBubble.tsx`

The assistant message bubble (line 86-91) uses `flex-1` but lacks `min-w-0`. Add `min-w-0` to the bubble div so that prose content and section cards are constrained to the available width instead of overflowing.

### File 4: `src/components/newton-assistant/NewtonResponseSection.tsx`

Add `min-w-0` to the outer card container (line 68) so section cards respect the parent's constrained width. Also add `overflow-hidden` to the content prose wrapper to prevent any residual overflow from LaTeX or code blocks.

---

## Summary

| File | Change |
|------|--------|
| `GlobalNewtonAssistant.tsx` | Add `min-w-0` to chat panel flex wrapper (desktop + mobile) |
| `NewtonChatPanel.tsx` | Add `min-w-0` to root container and ScrollArea |
| `NewtonMessageBubble.tsx` | Add `min-w-0` to assistant bubble div |
| `NewtonResponseSection.tsx` | Add `min-w-0` to card container |

All changes are single-class additions to ensure proper flex shrinking throughout the component tree.

