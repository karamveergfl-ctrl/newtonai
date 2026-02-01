
# Plan: Remove Push Ads & Add Banner Between Upload and Footer

## Overview

Based on your screenshots, I need to:
1. **Remove intrusive push/popup ads** (Ezmob vignette, Nap5k, and global Adsterra banner) from `index.html`
2. **Keep only the inline banner ads** that appear naturally on tool pages
3. **Add a banner ad between the upload section and footer** as shown in your reference image

---

## Current Problem

Your `index.html` has these intrusive global ad scripts that create popup/push ads:

| Ad Script | Zone | Issue |
|-----------|------|-------|
| Ezmob Vignette | 10543352 | Creates popup overlays |
| Nap5k | 10548751 | Creates push notifications/popups |
| Adsterra Global Banner | f68fadee12d992a26443bfb050da5b07 | Injects 300x250 banner in header |

These are causing the annoying popup shown in your screenshot with "Evelyn Avril - Dive into universe of instrumental".

---

## Solution

### Step 1: Clean Up `index.html` - Remove All Push/Popup Ads

**Remove lines 13-39** from `index.html` which contain:
- Ezmob Vignette script
- Nap5k script  
- Global Adsterra 300x250 banner

**Keep only:**
- Google Analytics (gtag)
- Meta tags and SEO content

### Step 2: Verify Tool Page Ad Placements

The current setup in `ToolPagePromoSections.tsx` already has:
- ✅ One `AdBanner` mid-page (after Features)
- ✅ One `AdBanner` above footer (after FAQ)

And in individual tool pages like `AIQuiz.tsx`:
- ✅ `PrimaryAdBanner` below the upload input area

This matches what you want - banners appear naturally within the page content.

---

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `index.html` | UPDATE | Remove Ezmob, Nap5k, and global Adsterra scripts (lines 13-39) |

---

## Result After Changes

**Removed:**
- ❌ Popup/vignette ads that appear over content
- ❌ Push notification style ads
- ❌ Global 300x250 banner injected in random places

**Kept:**
- ✅ Clean inline 728x90 leaderboard banners in tool pages
- ✅ `PrimaryAdBanner` below upload section
- ✅ `AdBanner` placements in promo sections

---

## Important Note About Adsterra Domain

The current Adsterra ad unit key (`c5d398ab0a723a7cfa61f3c2d7960602`) is configured for a different domain than your preview/production URLs. You need to:

1. Go to your Adsterra dashboard
2. Find the ad unit with key `c5d398ab0a723a7cfa61f3c2d7960602`
3. Add these domains to the allowed list:
   - `newtonai.lovable.app`
   - `lovableproject.com`

Without this, the banner ads will show 403 errors. The popup ads were likely working because they use a different zone ID.

---

## Technical Summary

```text
┌─────────────────────────────────────────────────┐
│                  index.html                     │
├─────────────────────────────────────────────────┤
│ REMOVE:                                         │
│ • Ezmob vignette (Zone: 10543352)              │
│ • Nap5k (Zone: 10548751)                       │
│ • Adsterra global (Zone: f68fadee)             │
│                                                 │
│ KEEP:                                           │
│ • Google Analytics                              │
│ • Meta tags / SEO                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              Tool Pages (Quiz, etc.)            │
├─────────────────────────────────────────────────┤
│ [Upload Section]                                │
│          ↓                                      │
│ [PrimaryAdBanner] ← Already exists              │
│          ↓                                      │
│ [ToolPagePromoSections]                         │
│   └── [AdBanner] mid-page                       │
│   └── [AdBanner] above footer                   │
│          ↓                                      │
│ [Footer]                                        │
└─────────────────────────────────────────────────┘
```
