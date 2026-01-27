
# Remove Inline Ad from Dashboard

## Problem

The advertisement banner is currently displayed in the middle of the dashboard page, directly after the "Your Study Progress" section. This interrupts the user experience and clutters the main content area.

## Solution

Remove the inline `AdBanner` from the dashboard page. The Footer component already contains ads (`AdBanner` and `RecommendationWidget`) that will continue to display for free users, providing ad visibility without disrupting the main dashboard flow.

## Implementation

### File: `src/pages/Index.tsx`

**Remove lines 1922-1924** - Delete the inline AdBanner and its comment:

```tsx
// DELETE THESE LINES:
{/* Banner Ad for Free Users */}
<AdBanner placement="inline" />
```

The AdBanner import on line 41 can optionally be removed if unused elsewhere, but keeping it won't cause issues.

## Result

| Before | After |
|--------|-------|
| Ad between StudyTracker and Upload zone | Clean dashboard layout |
| Ads in Footer | Ads in Footer (unchanged) |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove lines 1922-1924 (inline AdBanner) |

The Footer already displays ads for free users, so no changes are needed there.
