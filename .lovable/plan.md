

# Fix Header Logo Size and Alignment

## Problem
The logo in the header is oversized (80px on mobile, 160px on desktop) relative to the header height (64px / 80px), causing it to overflow and visually overlap with navigation items. The "NewtonAI" text also needs better alignment with the logo.

## Changes

### 1. Update Logo sizeMap (`src/components/Logo.tsx`)
- Change `xs` icon size from 80 to 44 (for mobile header)
- Add a new size variant or adjust existing ones so the header gets a properly sized logo
- Keep `md` at 160 for non-header uses (tool pages, etc.)
- Update compact margins to be tighter: `-ml-1 -mr-0.5 mt-0 -mb-1`

### 2. Update Header logo section (`src/components/Header.tsx`)
- Use `xs` size on mobile (44px) and `sm` on desktop instead of `md` (which is 120px -- still fits within 80px header with compact margins)
- Reduce `sm` sizeMap to ~56px so it fits neatly in the 80px desktop header
- Increase gap between logo and "NewtonAI" text from `gap-1` to `gap-1.5`
- Ensure the nav links have enough left margin so there's no visual collision

### Technical Details

**Logo.tsx sizeMap changes:**
```
xs: { icon: 44, text: "text-lg" }    // was 80
sm: { icon: 56, text: "text-xl" }    // was 120
```

Compact margins: `-ml-1 -mr-0.5 mt-0 -mb-0.5`

**Header.tsx logo link:**
- `Logo size={isMobile ? "xs" : "sm"} compact` (was `xs`/`md`)
- Gap: `gap-1.5` (was `gap-1`)

**Files to modify:**
- `src/components/Logo.tsx` -- sizeMap values and compact margins
- `src/components/Header.tsx` -- logo size prop and link gap

