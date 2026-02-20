

## Mobile-Optimize Newton Chat

The Newton chat panel needs several mobile-specific optimizations to feel native and use screen space efficiently on small devices.

### Changes

**File: `src/components/newton-assistant/NewtonChatPanel.tsx`**

1. **Remove border/shadow/rounded on mobile** -- The panel renders inside a full-screen drawer on mobile, so the outer `rounded-2xl border shadow-2xl` decorations waste space and look odd. Use `sm:rounded-2xl sm:border sm:shadow-2xl` instead.

2. **Compact the header on mobile** -- Reduce avatar size from `w-9 h-9` to `w-7 h-7` on mobile, tighten padding to `px-3 py-2 sm:px-4 sm:py-3`.

3. **Shrink the empty state** -- The heading `text-2xl` is too large for mobile. Use `text-lg sm:text-2xl`. Reduce Lottie animation margins (`mt-3 sm:mt-6`, `mb-4 sm:mb-8`). This ensures suggestions are visible without scrolling.

4. **Compact the input bar on mobile** -- Reduce button sizes from `42px` to `36px` on mobile (`h-9 w-9 sm:h-[42px] sm:w-[42px]`). Reduce textarea min-height similarly. Reduce input area padding to `p-2 sm:p-3`. This frees up vertical space for messages.

5. **Add safe-area padding** -- Add `pb-[env(safe-area-inset-bottom)]` to the input area for notched devices (iPhone).

6. **Compact message bubbles on mobile** -- In `NewtonMessageBubble.tsx`, reduce gap and avatar size on mobile: `gap-1.5 sm:gap-2.5`, avatar `w-6 h-6 sm:w-8 sm:h-8`.

7. **Compact response sections on mobile** -- In `NewtonResponseSection.tsx`, reduce section padding: `p-2 sm:p-3` for headers, `p-3 sm:p-4` for content. Shrink the section number badge to `w-5 h-5` on mobile.

**File: `src/components/newton-assistant/NewtonMessageBubble.tsx`**

- Avatar: `w-6 h-6 sm:w-8 sm:h-8`
- Gap: `gap-1.5 sm:gap-2.5`
- User bubble padding: `px-3 py-2 sm:px-3.5 sm:py-2.5`

**File: `src/components/newton-assistant/NewtonResponseSection.tsx`**

- Header padding: `p-2 sm:p-3`
- Content padding: `p-3 sm:p-4`
- Section number badge: `w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs`

**File: `src/components/GlobalNewtonAssistant.tsx`**

- Remove the drawer handle bar space by ensuring `DrawerContent` uses a tighter class without top padding/handle on mobile, so the chat panel header serves as the only top bar.

### Summary of File Changes

| File | Change |
|------|--------|
| `src/components/newton-assistant/NewtonChatPanel.tsx` | Remove mobile border/shadow, compact header, shrink empty state, smaller input buttons, safe-area padding |
| `src/components/newton-assistant/NewtonMessageBubble.tsx` | Smaller avatars and tighter gaps on mobile |
| `src/components/newton-assistant/NewtonResponseSection.tsx` | Compact padding and badge sizes on mobile |
| `src/components/GlobalNewtonAssistant.tsx` | Minor drawer content adjustments |

### Technical Details

**ChatPanel container (mobile-first):**
```
rounded-none border-0 shadow-none sm:rounded-2xl sm:border sm:shadow-2xl
```

**Input bar buttons (responsive):**
```
h-9 w-9 sm:h-[42px] sm:w-[42px]
```

**Empty state heading:**
```
text-lg sm:text-2xl mt-3 sm:mt-6 mb-4 sm:mb-8
```

**Message bubble avatars:**
```
w-6 h-6 sm:w-8 sm:h-8 gap-1.5 sm:gap-2.5
```

