

## Reduce Section Spacing Across Landing Page

The screenshots show excessive vertical gaps between all major sections (Hero to Problem/Solution, Problem/Solution to Features, Features to Comparison, etc.). The fix is straightforward -- reduce the `py-20 md:py-28` padding on each section to tighter values.

### Changes (single file: `src/pages/LandingPage.tsx`)

1. **Problem + Solution section** -- Change `py-20 md:py-28` to `py-12 md:py-16`
2. **Features section** -- Change `py-20 md:py-28` to `py-12 md:py-16`
3. **Competitor Comparison section** -- Change `py-20 md:py-28` to `py-12 md:py-16`
4. **Value Proposition (Students) section** -- Change `py-16` to `py-12`
5. **Trust / Used By section** -- Change `py-20` to `py-12`
6. **Final CTA section** -- Change `py-20` to `py-12`
7. **Hero section bottom padding** -- Change `pb-20 md:pb-28` to `pb-12 md:pb-16`

This will cut the whitespace between sections roughly in half, creating a tighter, more cohesive page flow.

