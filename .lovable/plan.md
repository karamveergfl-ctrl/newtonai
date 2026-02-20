

## Fix Clipped Logo in Sidebar

### Problem
The NewtonAI logo in the sidebar header is being cut off at the top and left edges. This happens because:
1. `SidebarHeader` has `pt-0 pb-0` -- no top padding
2. The `Logo` component applies `-ml-2` negative margin by default when `compact` is not set
3. The `ring-2 ring-primary/30` border ring on the logo icon extends outside the element box and gets clipped by the sidebar's overflow

### Fix

**File: `src/components/AppSidebar.tsx` (line 143)**

Add top and left padding to the `SidebarHeader` so the logo (including its ring) has breathing room:

- Change `className="px-1 pt-0 pb-0"` to `className="px-3 pt-3 pb-0"`

This adds 12px of padding on top and sides, preventing the logo's ring border from being clipped by the sidebar edge.

### Technical Details

| File | Change |
|------|--------|
| `src/components/AppSidebar.tsx` | Line 143: Change `SidebarHeader` padding from `px-1 pt-0 pb-0` to `px-3 pt-3 pb-0` |

