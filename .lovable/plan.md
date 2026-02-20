

## Fix WelcomeModal to Fit Mobile Screen Without Scrolling

### Problem
The WelcomeModal content overflows the mobile viewport, forcing users to scroll down to find the "Start Exploring" button. The modal should fit entirely on screen.

### Solution
Restructure the modal on mobile to be more compact so everything fits in one view:

**File: `src/components/WelcomeModal.tsx`**

1. **Reduce header padding and icon size further on mobile** -- `py-3` instead of `py-5`, icon `w-10 h-10`, smaller margin-bottom
2. **Shrink the features grid** -- Use smaller icon containers (`w-5 h-5`), tighter `gap-1.5`, reduce section padding to `px-4 py-2`
3. **Compact quick action cards** -- Reduce icon container to `w-8 h-8`, use `p-2` padding, tighter `space-y-1.5`
4. **Merge footer into quick actions section** -- Move the "Start Exploring" button directly below the quick actions with minimal spacing, removing the separate footer section on mobile
5. **Hide the "Get Started" heading on mobile** to save vertical space
6. **Use `flex flex-col` with `max-h-[100dvh]`** on the modal container so it never exceeds the viewport

### Key Layout Changes

| Section | Before (mobile) | After (mobile) |
|---------|-----------------|----------------|
| Header padding | `py-5` | `py-3` |
| Icon size | `w-12 h-12` | `w-10 h-10` |
| Features section | `px-6 py-4` | `px-4 py-2` |
| Quick actions padding | `p-4` | `p-3` |
| Quick action cards | `p-2.5`, `w-10 h-10` icon | `p-2`, `w-8 h-8` icon |
| Footer | Separate section with border | Inline button below actions, full-width on mobile |
| "Get Started" label | Visible | Hidden on mobile |

### Technical Details

The modal container will use:
```
max-h-[calc(100dvh-2rem)] flex flex-col
```

The footer will be simplified on mobile -- just a full-width "Start Exploring" button with minimal padding, no Esc hint, no border-top decoration.

**Files to edit:** `src/components/WelcomeModal.tsx` (single file change)
