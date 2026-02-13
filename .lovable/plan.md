
# Standardize Tool Page Headers to Match Screenshot Design

## Problem
Two tool pages (AI Summarizer and AI Podcast) use a left-aligned header layout, while the rest (Quiz, Flashcards, MindMap, Homework Help, Lecture Notes) already use the centered icon-on-top layout shown in the reference screenshot.

## Changes Required

### 1. AI Summarizer (`src/pages/tools/AISummarizer.tsx`)
- Replace the left-aligned header (inline icon + title) with the centered pattern:
  - Centered icon in a rounded container with `bg-primary/10`
  - Centered title below
  - Centered subtitle below the title
  - X close button stays absolute top-right
- Update container padding from `container mx-auto px-4 py-8` to `min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8` for consistency

### 2. AI Podcast (`src/pages/tools/AIPodcast.tsx`)
- Replace the left-aligned header (inline icon + gradient title + long description) with the centered pattern:
  - Centered Podcast icon in `bg-primary/10` rounded container
  - Centered "AI Podcast" title
  - Short centered subtitle
  - X close button stays absolute top-right

## Technical Details

**Target header pattern (already used by Quiz, Flashcards, etc.):**
```text
[centered icon in rounded bg]
[centered title - text-2xl sm:text-3xl font-display font-bold]
[centered subtitle - text-sm text-muted-foreground]
[absolute top-right X close button]
```

**Files to modify:**
- `src/pages/tools/AISummarizer.tsx` (lines ~888-909) - header section
- `src/pages/tools/AIPodcast.tsx` (lines ~390-416) - header section + outer container

No new dependencies or components needed. This is purely a styling/layout alignment change.
