

## Fix Home Button Position in Sidebar

### Problem
The Home button is visually crowded against the logo -- it sits too high and too far left, with no breathing room between the logo header and the Home navigation item.

### Fix

**File: `src/components/AppSidebar.tsx` (line 166)**

Change the Home section's `SidebarGroup` padding from `py-0` to `pt-2` so there's a visible gap between the logo and the Home button:

```
Before: <SidebarGroup className="py-0 shrink-0">
After:  <SidebarGroup className="pt-2 shrink-0">
```

This adds 8px of top padding between the logo header and the Home button, giving it proper visual separation without affecting the rest of the sidebar layout.

| File | Line | Change |
|------|------|--------|
| `src/components/AppSidebar.tsx` | 166 | Change `py-0` to `pt-2` on the Home SidebarGroup |

