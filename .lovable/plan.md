

# Fix Text Cutoff in Newton AI Chat

## Problem Analysis

Looking at the screenshot, the text content (especially LaTeX formulas like `$R_s = \frac{12V-5V}{0.02A}$`) is being cut off on the right side of the chat bubble. This happens because:

1. The chat panel has a fixed width of 380px
2. The message bubble is constrained to `max-w-[90%]` (about 342px)
3. `overflow-hidden` on the bubble container clips the content
4. Wide LaTeX formulas and long text cannot wrap or scroll

## Solution

Adjust the overflow and width settings to ensure all content is visible:

### Changes to `NewtonMessageBubble.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 87 | `max-w-[90%] overflow-hidden` | Remove `max-w-[90%]` for assistant messages, keep `overflow-hidden` for visual containment |
| 100 | `space-y-1` | Add `min-w-0` to ensure flex child shrinks properly |
| 109 | Plain markdown div | Add `break-words` and `overflow-wrap` for long text |

**Key changes:**
- Remove the `max-w-[90%]` constraint for assistant messages (they can use full available width)
- Keep `max-w-[90%]` only for user messages (bubble style)
- Add `min-w-0` to flex children to allow proper text wrapping
- Add `word-wrap: break-word` and `overflow-wrap: anywhere` for extremely long content

### Changes to `NewtonResponseSection.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 68 | `overflow-hidden` | Keep for visual, add inner scroll container |
| 98 | `overflow-x-auto` | Ensure KaTeX formulas can scroll horizontally if needed |
| 99 | prose classes | Add `[&_.katex]:overflow-x-auto [&_.katex]:max-w-full` |

### Changes to `MarkdownRenderer.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 165 | KaTeX styles | Add `[&_.katex]:break-words [&_.katex-html]:flex-wrap` to allow formula wrapping |

## Technical Details

### File 1: `src/components/newton-assistant/NewtonMessageBubble.tsx`

```typescript
// Line 85-91: Adjust bubble container
<div
  className={cn(
    "flex-1 rounded-2xl",
    isUser
      ? "max-w-[85%] bg-primary text-primary-foreground rounded-br-md px-3.5 py-2.5"
      : "bg-muted/40 text-foreground rounded-bl-md px-3 py-2 min-w-0"
  )}
>

// Line 100: Add min-w-0 to sections container
<div className="space-y-1 min-w-0">

// Line 109: Add word-break utilities
<div key={idx} className="prose prose-sm dark:prose-invert max-w-none mb-3 break-words [overflow-wrap:anywhere]">

// Line 117: Add word-break utilities
<div className="prose prose-sm dark:prose-invert max-w-none break-words [overflow-wrap:anywhere]">
```

### File 2: `src/components/newton-assistant/NewtonResponseSection.tsx`

```typescript
// Line 98-101: Ensure content can wrap/scroll
<div className="p-4 text-sm min-w-0">
  <div className="prose prose-sm dark:prose-invert max-w-none break-words [overflow-wrap:anywhere] [&_.katex-display]:overflow-x-auto [&_.katex]:max-w-full">
    <MarkdownRenderer content={section.content} />
  </div>
</div>
```

### File 3: `src/components/MarkdownRenderer.tsx`

```typescript
// Line 165: Enhanced KaTeX overflow handling
"[&_.katex]:text-base [&_.katex-display]:my-6 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2 [&_.katex-display]:max-w-full [&_.katex]:break-words",
```

## Summary of Changes

| File | Change |
|------|--------|
| `NewtonMessageBubble.tsx` | Remove `max-w-[90%]` for assistant messages, add `min-w-0`, add word-break utilities |
| `NewtonResponseSection.tsx` | Add `min-w-0`, word-break utilities, and KaTeX overflow handling |
| `MarkdownRenderer.tsx` | Add KaTeX max-width and break-words styles |

## Result

After these changes:
- Text will wrap properly within the chat bubble
- LaTeX formulas that are too wide will be horizontally scrollable
- Long words will break to fit the container
- All content will be fully visible

