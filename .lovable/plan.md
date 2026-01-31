
# Plan: Monetag Compliance Overhaul for NewtonAI

## Overview

This plan addresses Monetag's site and zone rejection by implementing a comprehensive compliance strategy. The changes will transform the ad loading behavior from automatic/page-load to user-initiated only, remove all incentivized language, add bot detection safeguards, and ensure content/brand safety.

---

## Current State Analysis

### Issues Identified:

1. **Automatic Ad Loading**: `NativeAdBanner.tsx` loads ads on page mount via lazy-loading (IntersectionObserver), which Monetag considers "without clear user intent"

2. **Incentivized Language Throughout App**:
   - `/credits` page titled "Earn Credits" with "Watch & Earn" section
   - `CreditBalance.tsx` popover shows "Earn Credits" with "Watch 30s/60s video" buttons
   - `CreditModal.tsx` says "Earn credits by watching a short video"
   - `SmartlinkTimer.tsx` dialog titled "Earn Credits"
   - Multiple comparison pages mention "earn credits by watching optional video ads"
   - `RulesCard.tsx` lists rules about earning credits

3. **No Bot Detection**: No safeguards against bots, headless browsers, or automated scripts

4. **Multiple Ads Per Page**: Currently 3 placements (below-action, mid-page, above-footer) can appear simultaneously

5. **Ad Reload on Route Changes**: `useEzoicRouteRefresh.ts` refreshes ads on navigation

---

## Implementation Plan

### 1. Remove Entire Earn-Credits System

**Files to modify:**
- Delete or completely refactor `src/pages/Credits.tsx`
- Delete `src/components/earn-credits/` folder (AdButton.tsx, DailyProgress.tsx, RulesCard.tsx, SmartlinkTimer.tsx, index.ts)
- Remove credit-earning functionality from `src/hooks/useEarnCredits.ts`
- Remove `earnCredits` from `src/contexts/CreditsContext.tsx`
- Remove `earnCredits` references from:
  - `src/components/CreditBalance.tsx`
  - `src/components/CreditModal.tsx`
  - `src/components/FeatureGate.tsx`
  - `src/components/VideoGate.tsx`
  - `src/pages/Index.tsx`
  - `src/pages/tools/AISummarizer.tsx`

**Rationale**: The entire "watch video to earn credits" system is incentivized traffic, which Monetag explicitly prohibits.

---

### 2. Transform NativeAdBanner to User-Initiated Only

**File: `src/components/NativeAdBanner.tsx`**

Changes:
- Remove automatic IntersectionObserver loading
- Add new prop `trigger: 'scroll-50' | 'button-click' | 'study-complete'`
- Only load ad after one of these user actions:
  - User scrolls past 50% of page content
  - User explicitly clicks a button
  - User completes a study action (finishes quiz, generates flashcards, etc.)
- Add bot detection checks before loading
- Limit to ONE ad per page (remove mid-page and above-footer, keep only one per page)

New implementation approach:
```
- Add useScrollProgress hook to detect 50% scroll
- Add isBot() detection function
- Only render iframe AFTER trigger condition is met AND isBot() returns false
- Collapse container if no ad loads (no empty placeholders)
```

---

### 3. Add Bot Detection Utility

**New file: `src/utils/botDetection.ts`**

Create a utility that checks for:
- `navigator.webdriver` (headless browsers)
- Missing `navigator.languages`
- Suspicious user agents (HeadlessChrome, PhantomJS, etc.)
- Missing plugins
- Inconsistent screen dimensions
- High automation probability signals

This will be used by ad components to suppress ads for suspicious traffic.

---

### 4. Update CreditBalance Component

**File: `src/components/CreditBalance.tsx`**

Changes:
- Remove entire "Earn Credits" section (lines 125-198)
- Remove "Watch video" buttons
- Keep only balance display and "Upgrade to Premium" CTA
- Remove `earnCredits`, `canWatchMoreAds`, `getRemainingAds` imports

---

### 5. Update CreditModal Component

**File: `src/components/CreditModal.tsx`**

Changes:
- Remove "Earn credits by watching a short video" text
- Remove video watch buttons
- Show only "Upgrade to Premium" as the solution
- Simplify to just show current balance and upgrade CTA

---

### 6. Remove Incentivized Language from Comparison Pages

**Files to modify:**
- `src/pages/compare/CheggComparison.tsx` - Remove "Watch a short video ad to earn credits"
- `src/pages/compare/StudocuComparison.tsx` - Remove "earn credits by watching optional video ads"
- `src/pages/compare/CourseHeroComparison.tsx` - Remove "video ads to earn credits"

Replace with neutral language like "free tier with optional ads to support the service"

---

### 7. Remove Ad Refresh on Route Changes

**File: `src/hooks/useEzoicRouteRefresh.ts`**

Either:
- Delete this hook entirely, OR
- Modify to NOT refresh Monetag ads (only Ezoic if still used)

---

### 8. Update App Routes

**File: `src/App.tsx`**

- Remove the `/credits` route since that page promotes incentivized behavior
- Or redirect `/credits` to `/pricing`

---

### 9. Ensure Content & Brand Safety Pages Exist

**Verification (already present):**
- `/privacy` - Privacy.tsx exists with comprehensive policy
- `/terms` - Terms.tsx exists with full terms of service
- `/contact` - Contact.tsx exists with contact form
- `/about` - About.tsx exists describing the platform

**Optional Enhancement:**
Add a meta description to index.html or SEOHead emphasizing "Educational AI study tool" as the platform description.

---

### 10. Safe Ad Failure Behavior

**File: `src/components/NativeAdBanner.tsx`**

Add:
- No retry logic on ad load failure
- No fallback redirects
- Collapse/hide container if ad fails to load
- No empty "Sponsored" placeholder when no ad

---

## File Change Summary

| File | Action |
|------|--------|
| `src/components/NativeAdBanner.tsx` | Major refactor: user-initiated, bot detection, single ad |
| `src/utils/botDetection.ts` | New file: bot/automation detection |
| `src/pages/Credits.tsx` | Delete or redirect to /pricing |
| `src/components/earn-credits/*` | Delete entire folder |
| `src/hooks/useEarnCredits.ts` | Delete or gut functionality |
| `src/contexts/CreditsContext.tsx` | Remove `earnCredits` and related functions |
| `src/components/CreditBalance.tsx` | Remove earn section, keep balance only |
| `src/components/CreditModal.tsx` | Remove watch-video options |
| `src/components/FeatureGate.tsx` | Remove `earnCredits` references |
| `src/components/VideoGate.tsx` | Remove `earnCredits` references |
| `src/pages/Index.tsx` | Remove `earnCredits` references |
| `src/pages/tools/AISummarizer.tsx` | Remove `earnCredits` references |
| `src/pages/compare/CheggComparison.tsx` | Remove incentivized language |
| `src/pages/compare/StudocuComparison.tsx` | Remove incentivized language |
| `src/pages/compare/CourseHeroComparison.tsx` | Remove incentivized language |
| `src/hooks/useEzoicRouteRefresh.ts` | Disable auto-refresh for Monetag |
| `src/App.tsx` | Remove or redirect /credits route |

---

## Technical Implementation Details

### Bot Detection Function
```text
function isBot(): boolean {
  // Check for automation flags
  if (navigator.webdriver) return true;
  
  // Check for missing languages
  if (!navigator.languages || navigator.languages.length === 0) return true;
  
  // Check suspicious user agents
  const botPatterns = /headless|phantom|puppeteer|selenium|webdriver/i;
  if (botPatterns.test(navigator.userAgent)) return true;
  
  // Check for inconsistent screen
  if (window.outerWidth === 0 || window.outerHeight === 0) return true;
  
  return false;
}
```

### Scroll Progress Detection
```text
function useScrollProgress() {
  const [scrollPercent, setScrollPercent] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollPercent(percent);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return scrollPercent;
}
```

---

## Expected Outcome

After implementation:
- Ads only load after meaningful user engagement (50% scroll)
- No incentivized language anywhere in the app
- Bot traffic is filtered out
- Only one ad per page
- No automatic ad refresh
- Clean failure handling with no empty placeholders
- Platform clearly positioned as "Educational AI study tool"
- All required policy pages exist and are accessible

This should satisfy Monetag's publisher policies and allow zone re-approval.
