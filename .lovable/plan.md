

## Mobile Bottom Nav Active Indicator + Theme Toggle Verification

### Theme Toggle on Mobile
The Profile Settings tab **already has a theme toggle** in the "Preferences" card (line 537-551 of `SettingsPanel.tsx`). It shows Light / Dark / System buttons and persists the choice to the database. No changes needed here.

### Active Indicator Animation for Bottom Nav

Add a subtle dot indicator below the active tab's label and a slight scale-up on the active icon for better visual feedback.

**File: `src/components/MobileBottomNav.tsx`**

For each regular nav button (Home, Snap, Tools, Profile):
- Add a small 4px dot below the label when active, using `transition-all` for a smooth appearance
- Scale the icon slightly (`scale-110`) when active for emphasis
- Add `transition-transform duration-200` to the icon for smooth scaling

Changes to the button rendering (lines 98-111):

```tsx
<button
  key={item.label}
  onClick={() => item.path && navigate(item.path)}
  className={cn(
    "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 focus:outline-none transition-colors",
    isActive ? "text-primary" : "text-muted-foreground"
  )}
  aria-label={item.label}
>
  <div className={cn("transition-transform duration-200", isActive && "scale-110")}>
    {item.icon}
  </div>
  <span className="text-[10px] font-medium">{item.label}</span>
  <div className={cn(
    "w-1 h-1 rounded-full bg-primary transition-all duration-200",
    isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
  )} />
</button>
```

This adds:
1. A **scale-up** (1.1x) on the active icon -- subtle but noticeable
2. A **4px dot** below the label that fades and scales in when active
3. Smooth CSS transitions (no framer-motion) per the project's animation policy

### Summary

| Change | File | Description |
|--------|------|-------------|
| Active dot + icon scale | `MobileBottomNav.tsx` | Add indicator dot and scale animation to active tab |
| Theme toggle | Already exists | `SettingsPanel.tsx` Preferences card has Light/Dark/System buttons |

