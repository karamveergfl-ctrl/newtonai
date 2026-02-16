

# Increase Header Logo Size

## Problem
After the previous fix, the logo is now too small (44px) to see clearly in the header.

## Solution
Increase the `xs` and `sm` sizes in the Logo sizeMap to a middle ground that fits the header but is still clearly visible:

- `xs`: 44 -> 52 (mobile header, fits within 64px height)
- `sm`: 56 -> 64 (desktop header, fits within 80px height)

Adjust compact margins slightly to `-ml-2 -mr-1 mt-0 -mb-0.5` so the larger logo still sits snugly without extra whitespace.

## Files to modify
- `src/components/Logo.tsx` -- update `xs` to 52, `sm` to 64, and tweak compact margins

