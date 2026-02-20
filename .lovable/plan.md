

## Make Newton Character Image Circular

### Problem
The Newton character image in the FloatingToolsShowcase (bottom-right of the phone mockup) renders as a rectangular image. The user wants it displayed in a circular frame instead.

### Fix in `src/components/FloatingToolsShowcase.tsx`

Change the Newton character container (lines 149-159) to:
- Make the container square (equal width/height) instead of taller than wide
- Add `rounded-full` and `overflow-hidden` to clip the image into a circle
- Add a subtle border ring for polish (`ring-2 ring-primary/20`)
- Use `object-cover` instead of `object-contain` so the image fills the circle
- Adjust sizing to `w-14 h-14 md:w-18 md:h-18` (square dimensions)

### Technical Details

| File | Change |
|------|--------|
| `src/components/FloatingToolsShowcase.tsx` (lines 149-159) | Make the Newton image container circular with `rounded-full`, `overflow-hidden`, square sizing, and `object-cover` |

Single file change, no other files affected.
