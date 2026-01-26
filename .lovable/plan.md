
# Zoom In Logo to Make Newton Fill Container Completely

## Issue

The current logo has `scale-125` applied to the Newton image, but there's still a visible outline/edge around the container. The Newton character needs to fill the container completely without any visible background or border.

## Solution

Increase the scale transform from `scale-125` to `scale-150` to make Newton zoom in more and completely fill the rounded container, eliminating any visible outline.

## Implementation

### File: `src/components/Logo.tsx`

**Line 41** - Change scale value:

| Before | After |
|--------|-------|
| `scale-125` | `scale-150` |

```tsx
<img
  src={newtonLogo}
  alt="NewtonAI Logo"
  className="w-full h-full object-cover scale-150"
/>
```

## Visual Result

```
BEFORE (scale-125)          AFTER (scale-150)
+-------+                   +-------+
|  ___  | visible edge      |███████| Newton fills
| /   \ |                   |███N███| entire container
| \_N_/ |                   |███████| 
+-------+                   +-------+
```

## Single File Change

| File | Change |
|------|--------|
| `src/components/Logo.tsx` | Line 41: Change `scale-125` to `scale-150` |
