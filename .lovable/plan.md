

# Fix Newton AI Chat UI/UX + Mobile Optimization

## Issues Identified

### 1. "Explain by AI" Button Text Cut Off
In the screenshot, the "Explain by AI" buttons on section cards are clipped, showing only "E..." on the right edge. This happens because:
- The section header uses `flex items-center justify-between` but the heading text uses `truncate` which fights with the Explain button for space
- The Explain button needs guaranteed minimum width
- On narrower containers, the button label gets clipped by the card's `overflow-hidden`

### 2. Empty Content Below Section Headers
The section cards show large blank gaps below the header. The expanded content area (`max-h-[3000px]`) renders fine, but the bottom "Explain" button section has a `border-t` and padding even when there is minimal content, creating visual dead space.

### 3. Mobile UX Issues Across the App
- Newton sidebar (w-64 / 256px) takes too much space on mobile, leaving almost no room for the chat panel
- Section cards overflow on small screens
- Input bar buttons crowd together on narrow viewports

---

## Changes

### File 1: `src/components/newton-assistant/NewtonResponseSection.tsx`

**Fix Explain button visibility:**
- Change the section header layout so the heading text gets `min-w-0` and `truncate` while the Explain button is always fully visible with `shrink-0` and `whitespace-nowrap`
- On mobile (small screens), show a shorter "Explain" label instead of "Explain by AI" to save space
- Remove the duplicate bottom Explain button entirely -- it adds clutter and the top one is sufficient
- Reduce vertical padding/margins for tighter cards

**Specific changes:**
- Header: wrap heading in a `min-w-0 flex-1` container so it truncates, keep Explain button as `shrink-0`
- ExplainButton: add `whitespace-nowrap` class, use shorter text on mobile via responsive classes (`hidden sm:inline` for "by AI" part)
- Remove the bottom `<div className="flex justify-end p-3 pt-0 ...">` with the second ExplainButton
- Change `my-3` on the card container to `my-2`

### File 2: `src/components/newton-assistant/NewtonMessageBubble.tsx`

**Fix assistant message bubble width:**
- The assistant bubble currently uses `flex-1` which can cause it to stretch and push content wide
- Add `max-w-full` and ensure `overflow-hidden` on the bubble to prevent section cards from overflowing
- On section cards container, add `overflow-hidden` to prevent any child overflow

### File 3: `src/components/newton-assistant/NewtonChatPanel.tsx`

**Mobile input bar optimization:**
- Stack attachment/voice buttons more compactly on mobile
- Ensure 44x44px touch targets are maintained
- On mobile, hide the "Press Enter to send" hint text (not relevant on mobile keyboards)

### File 4: `src/components/newton-assistant/NewtonSidebar.tsx`

**Mobile sidebar optimization:**
- Change width from fixed `w-64` to responsive: `w-full sm:w-64` so on mobile it takes full width as an overlay
- Add absolute positioning on mobile so it overlays the chat instead of squeezing it
- Add a semi-transparent backdrop on mobile

### File 5: `src/components/GlobalNewtonAssistant.tsx`

**Mobile layout fix:**
- On mobile drawer, when sidebar is shown, render it as a full-width overlay instead of side-by-side flex
- Ensure the drawer content properly handles the sidebar overlay pattern

### File 6: `src/components/MarkdownRenderer.tsx`

**Mobile text sizing:**
- The prose classes use `prose-sm md:prose-base lg:prose-lg` which is too large inside Newton chat cards
- When rendered inside Newton sections (which already have `prose-sm`), the parent `prose-sm` class should take precedence -- no change needed here, but ensure the Newton-specific wrapper classes override correctly

---

## Summary of Changes

| File | What Changes |
|------|-------------|
| `NewtonResponseSection.tsx` | Fix Explain button clipping, remove duplicate bottom button, tighter spacing, mobile-friendly label |
| `NewtonMessageBubble.tsx` | Add overflow protection on assistant bubbles |
| `NewtonChatPanel.tsx` | Mobile input bar cleanup, hide desktop-only hint text on mobile |
| `NewtonSidebar.tsx` | Responsive width, mobile overlay pattern |
| `GlobalNewtonAssistant.tsx` | Mobile sidebar as overlay instead of side-by-side |

