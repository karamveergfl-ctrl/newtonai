

## Profile Page Tab Reorder and Quick-Access Enhancements

### 1. Reorder Tabs: Settings First

The current tab order is: History | Notifications | Settings | Usage

Change to match the image: **Settings | History | Notifications | Usage**

This puts the most-used tab (Settings) in the primary position.

**File: `src/pages/Profile.tsx`**
- Swap the `TabsTrigger` order so Settings comes first, then History
- Move the corresponding `TabsContent` blocks to match

### 2. Add Quick-Access Shortcuts to Settings

Add useful quick-access rows to the Settings panel for features users need frequently:

**File: `src/components/profile/SettingsPanel.tsx`**

Add a new "Quick Access" card at the top of Settings with:
- **My Credits** -- navigate to `/profile?tab=usage` (shows credit balance inline)
- **Pricing / Upgrade** -- navigate to `/pricing`
- **Help & FAQ** -- navigate to `/faq`
- **Contact Support** -- navigate to `/contact`

### 3. Add Data Management Section

Add a "Data & Privacy" card with:
- **Clear Search History** -- button to delete all search history
- **Privacy Policy** -- link to `/privacy`
- **Terms of Service** -- link to `/terms`

### Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Profile.tsx` | Reorder tabs: Settings first, then History |
| `src/components/profile/SettingsPanel.tsx` | Add Quick Access card and Data & Privacy card |

### Technical Details

**Profile.tsx tab reorder:**
```
TabsList order: settings -> history -> notifications -> usage
TabsContent order matches accordingly
```

**SettingsPanel.tsx new cards:**
- Quick Access card with navigation rows using `navigate()` and `ChevronRight` arrows
- Data & Privacy card with Clear History action and policy links
- Both use existing `SettingRow` and `IndicatorDot` components for consistency

