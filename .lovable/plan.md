
# Reduce Header Height and Remove Edge Spacing

## Problem
The header has too much vertical height (h-16 / h-20) and the container has horizontal padding (px-4) that creates visible gaps in the corners, especially around the logo area.

## Changes

### 1. Reduce header height (`src/components/Header.tsx`)
- Change `h-16 md:h-20` to `h-12 md:h-14` on the inner flex container (line 101)
- Update the spacer div from `h-16 md:h-20` to `h-12 md:h-14` (line 246)
- Update mobile menu top offset from `top-16` to `top-12` (line 227)

### 2. Remove edge padding
- Change the container div from `container mx-auto px-4` to `px-2 md:px-4` to reduce horizontal gaps, especially in the left corner near the logo

### 3. Adjust logo margins for tighter header
- In `src/components/Logo.tsx`, tighten the compact margins slightly to account for the shorter header

## Technical Details

**Header.tsx changes:**
- Line 101: `h-16 md:h-20` -> `h-12 md:h-14`
- Line 100: `container mx-auto px-4` -> `w-full px-2 md:px-4`
- Line 227: `top-16` -> `top-12`
- Line 246: `h-16 md:h-20` -> `h-12 md:h-14`

**Files to modify:**
- `src/components/Header.tsx`
