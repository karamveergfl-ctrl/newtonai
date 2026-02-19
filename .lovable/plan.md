

## Fix: Logo Icon Clipped by Container

### Problem
The circular logo icon has `overflow-hidden` AND `ring-2 ring-primary/30` on the same container. CSS `ring` renders **outside** the element's border box, but `overflow-hidden` clips everything outside the box -- so the ring gets cut off, making the logo appear clipped on the left and top edges.

### Fix in `src/components/Logo.tsx`

Separate the ring from the overflow container by nesting two divs:
- **Outer div**: carries the `ring-2 ring-primary/30`, `rounded-full`, sizing, and margins -- NO `overflow-hidden`
- **Inner div**: carries `overflow-hidden rounded-full w-full h-full` to clip the image

This lets the ring paint outside the image boundary without being clipped.

```
Outer: ring-2, rounded-full, sized (no overflow-hidden)
  Inner: overflow-hidden, rounded-full (clips image only)
    img
```

### Technical Details

| File | Change |
|------|--------|
| `src/components/Logo.tsx` (line 25-27) | Split the icon container into outer (ring + sizing) and inner (overflow-hidden + image) divs |

No other files need changes -- Header and Sidebar both use the Logo component.

