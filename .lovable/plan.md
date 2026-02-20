

## Mobile-Optimize All Modals, Banners, and Overlays

The screenshot shows the WelcomeModal overflowing on mobile with no scrolling, and the content gets cut off behind the bottom nav. This plan addresses all modal/banner/overlay components to ensure they fit and scroll properly on mobile screens.

### Problem

Several modals and overlays are not mobile-optimized:
- **WelcomeModal**: Custom modal without scroll support, content overflows on small screens
- **Dialog-based modals** (UsageLimitModal, CreditModal, GuestTrialLimitModal, SignInRequiredModal, NewUserWelcomeModal): The base `DialogContent` lacks `max-h` and `overflow-y-auto` on mobile, causing content to be cut off
- **LevelUpModal**: Custom overlay, needs mobile padding for bottom nav
- **FloatingUpgradeBanner**: Already has `bottom-20` for mobile, but could use minor refinements
- **FeatureShowcase**: Dense grid can overflow inside modals on mobile

### Changes

#### 1. `src/components/ui/dialog.tsx` -- Add mobile-safe scrolling to base DialogContent

Add `max-h-[calc(100dvh-2rem)]` and `overflow-y-auto` to the base DialogContent class so ALL dialog-based modals automatically scroll on mobile. Also add proper margin so content clears the bottom nav.

#### 2. `src/components/WelcomeModal.tsx` -- Make scrollable and compact on mobile

- Add `max-h-[calc(100dvh-2rem)] overflow-y-auto` to the modal container
- Reduce header padding on mobile: `px-4 py-5 sm:px-6 sm:py-8`
- Make the icon smaller on mobile: `w-12 h-12 sm:w-16 sm:h-16`
- Reduce heading size: `text-lg sm:text-xl`
- Compact the quick action cards: `p-2.5 sm:p-3`
- Hide the Esc keyboard hint on mobile (not relevant for touch devices)
- Reduce the "Get Started" section padding: `p-4 sm:p-6`

#### 3. `src/components/NewUserWelcomeModal.tsx` -- Compact for mobile

- Add `max-h-[85vh] overflow-y-auto` to the inner content div
- Reduce heading: `text-xl sm:text-2xl`
- Compact feature grid items: smaller padding on mobile
- Reduce spacing between sections: `mb-4 sm:mb-6`

#### 4. `src/components/LevelUpModal.tsx` -- Add safe-area and mobile padding

- Add `pb-20 sm:pb-0` to clear the mobile bottom nav
- Reduce Newton animation size on mobile: `w-24 h-24 sm:w-32 sm:h-32`
- Reduce padding: `p-6 sm:p-8`

#### 5. `src/components/UsageLimitModal.tsx` -- Already has `max-h-[90vh]`, minor tweaks

- The `FeatureShowcase` is heavy inside this modal; hide it on mobile or show compact version
- Add `max-h-[85dvh]` instead of `90vh` to account for bottom nav

#### 6. `src/components/FeatureShowcase.tsx` -- Mobile compact mode

- Reduce padding and font sizes on mobile
- Use single column on very small screens for the feature grid inside modals

### Summary of File Changes

| File | Change |
|------|--------|
| `src/components/ui/dialog.tsx` | Add `max-h-[calc(100dvh-2rem)] overflow-y-auto` to base DialogContent |
| `src/components/WelcomeModal.tsx` | Scrollable container, reduced padding/sizes, hide Esc hint on mobile |
| `src/components/NewUserWelcomeModal.tsx` | Scrollable inner content, compact spacing on mobile |
| `src/components/LevelUpModal.tsx` | Safe-area padding, smaller animation on mobile |
| `src/components/UsageLimitModal.tsx` | Use `85dvh`, show compact FeatureShowcase on mobile |
| `src/components/FeatureShowcase.tsx` | Responsive grid and tighter spacing on mobile |

### Technical Details

**dialog.tsx base class update:**
```
max-h-[calc(100dvh-2rem)] overflow-y-auto
```
This single change cascades to CreditModal, GuestTrialLimitModal, SignInRequiredModal, and UsageLimitModal automatically.

**WelcomeModal mobile-first classes:**
```
px-4 py-5 sm:px-6 sm:py-8  (header)
p-4 sm:p-6                  (quick actions section)
w-12 h-12 sm:w-16 sm:h-16   (sparkle icon)
text-lg sm:text-xl           (title)
hidden sm:inline             (Esc hint)
```

**LevelUpModal safe-area:**
```
p-6 sm:p-8                   (padding)
w-24 h-24 sm:w-32 sm:h-32    (newton animation)
mb-20 sm:mb-0                 (bottom nav clearance)
```

