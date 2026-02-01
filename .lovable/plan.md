
# Plan: Fix Adsterra Banner Ads Not Showing Instantly

## Problem Analysis

Based on code review, there are two issues preventing ads from showing instantly:

### Issue 1: Incomplete Migration
Several pages still use the old `SmartBanner` component which relies on the `get-banner-ad` edge function:
- `LandingPage.tsx` (3 placements)
- `FAQ.tsx` (2 placements)
- `Compare.tsx` (3 placements)
- `ChatGPTComparison.tsx` (2 placements)
- `StudyFetchComparison.tsx` (2 placements)

### Issue 2: Missing Iframe Sandbox Permission
The current `AdBanner` component uses:
```tsx
sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
```

Adsterra scripts require `allow-same-origin` to:
- Access cookies for ad targeting/tracking
- Use localStorage for frequency capping
- Execute cross-origin script callbacks properly

Without this permission, the Adsterra script loads but cannot properly fetch and render ad content.

---

## Solution

### 1. Fix AdBanner Sandbox Permissions

Add `allow-same-origin` to the iframe sandbox attribute:

**File:** `src/components/AdBanner.tsx`

```tsx
<iframe
  srcDoc={AD_HTML}
  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
  className="border-0 w-[728px] max-w-full h-[90px] overflow-hidden rounded-lg"
  title="Advertisement"
/>
```

### 2. Complete Migration to AdBanner

Replace remaining `SmartBanner` usages with the simplified `AdBanner`:

| File | Current | Change To |
|------|---------|-----------|
| `src/pages/LandingPage.tsx` | 3x SmartBanner | 3x AdBanner |
| `src/pages/FAQ.tsx` | 2x SmartBanner | 2x AdBanner |
| `src/pages/compare/Compare.tsx` | 3x SmartBanner | 3x AdBanner |
| `src/pages/compare/ChatGPTComparison.tsx` | 2x SmartBanner | 2x AdBanner |
| `src/pages/compare/StudyFetchComparison.tsx` | 2x SmartBanner | 2x AdBanner |

### 3. Optional Cleanup (After Verification)

Once ads work correctly, remove unused files:
- `src/components/SmartBanner.tsx`
- `src/components/AdsterraBanner.tsx`  
- `src/contexts/BannerAdContext.tsx`
- Remove `BannerAdProvider` from `App.tsx`

---

## Technical Details

### Why `allow-same-origin` is Required

The Adsterra ad script (`invoke.js`) dynamically creates an internal iframe to display ads. Without `allow-same-origin`:
- The script cannot access the parent frame's origin
- Cookie-based ad targeting fails
- The dynamically created ad iframe may be blocked

### Security Considerations

Using `allow-same-origin` with `allow-scripts` does give the iframe full script execution capabilities with access to the parent's origin. However, since:
1. The ad content comes from a trusted ad network (Adsterra)
2. The iframe is sandboxed from other DOM elements
3. This is standard practice for display advertising

This is an acceptable trade-off for functional ad delivery.

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/AdBanner.tsx` | Add `allow-same-origin` to sandbox |
| `src/pages/LandingPage.tsx` | Replace SmartBanner with AdBanner |
| `src/pages/FAQ.tsx` | Replace SmartBanner with AdBanner |
| `src/pages/compare/Compare.tsx` | Replace SmartBanner with AdBanner |
| `src/pages/compare/ChatGPTComparison.tsx` | Replace SmartBanner with AdBanner |
| `src/pages/compare/StudyFetchComparison.tsx` | Replace SmartBanner with AdBanner |

---

## Expected Result

After implementation:
1. Adsterra scripts can properly execute and fetch ad creatives
2. Ads load faster without edge function network round-trip
3. Consistent ad behavior across all pages
4. Premium users and deep study mode still hide ads correctly
