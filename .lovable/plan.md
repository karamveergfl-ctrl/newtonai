

## Plan: Remove All Monetag/Adsterra Ad Tags

### Overview

This plan removes all Monetag/Adsterra ad infrastructure from NewtonAI, including components, hooks, utilities, and external script references in index.html.

---

### Files to Delete

| File | Purpose |
|------|---------|
| `src/components/NativeAdBanner.tsx` | Main Adsterra banner ad component |
| `src/components/EzoicAdPlaceholder.tsx` | Ezoic ad placeholder component |
| `src/hooks/useEzoicRouteRefresh.ts` | Hook for refreshing Ezoic ads on route changes |
| `src/hooks/useScrollProgress.ts` | Hook used only for ad loading trigger |
| `src/utils/botDetection.ts` | Bot detection utility used only for ad compliance |

---

### Files to Modify

#### 1. `index.html` - Remove External Ad Scripts

Remove:
- Lines 4-6: Gatekeeper Consent scripts (GDPR for ads)
- Lines 8-13: Ezoic Ad Platform script and ezstandalone initialization
- Line 27: Ezoic domain verification meta tag
- Lines 39-41: Google AdSense meta tag and script

Keep:
- Google Analytics (gtag.js)
- All SEO meta tags and structured data
- Font preloads

---

#### 2. `src/App.tsx` - Remove Ezoic Hook

Changes:
- Remove import: `import { useEzoicRouteRefresh } from "@/hooks/useEzoicRouteRefresh";` (line 7)
- Remove call: `useEzoicRouteRefresh();` (line 77)

---

#### 3. `src/components/tool-sections/ToolPagePromoSections.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 12)
- Remove JSX: `<NativeAdBanner />` (line 65)

---

#### 4. `src/components/tool-sections/index.ts` - Remove Export

Changes:
- Remove line 19: `export { NativeAdBanner } from "@/components/NativeAdBanner";`

---

#### 5. `src/pages/LandingPage.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 10)
- Remove JSX: `<NativeAdBanner />` (lines 281-282)

---

#### 6. `src/pages/BlogPost.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 9)
- Remove JSX: `<NativeAdBanner />` (lines 660-661)

---

#### 7. `src/pages/FAQ.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 8)
- Remove JSX: `<NativeAdBanner />` (lines 142-143)

---

#### 8. `src/pages/Pricing.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 22)
- Remove JSX: `<NativeAdBanner />` (lines 406-407)

---

#### 9. `src/pages/Contact.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 12)
- Remove JSX: `<NativeAdBanner />` (lines 132-133)

---

#### 10. `src/pages/Blog.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 9)
- Remove JSX: `<NativeAdBanner />` (lines 175-176)

---

#### 11. `src/pages/About.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 8)
- Remove JSX: `<NativeAdBanner />` (lines 120-121)

---

#### 12. `src/pages/Enterprise.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 14)
- Remove JSX: `<NativeAdBanner />` (lines 305-306)

---

#### 13. `src/pages/Tools.tsx` - Remove Ad Banner

Changes:
- Remove import: `import { NativeAdBanner } from "@/components/NativeAdBanner";` (line 20)
- Remove JSX: `<NativeAdBanner />` (lines 233-234)

---

### Summary

| Action | Count |
|--------|-------|
| Files to delete | 5 |
| Files to modify | 13 |
| External scripts removed | 4 (Gatekeeper CMP x2, Ezoic, AdSense) |
| Ad components removed | 13 instances |

---

### Expected Outcome

After implementation:
- No ad scripts loading from external domains
- No ad containers rendered anywhere in the app
- Cleaner page load (faster performance)
- No Monetag/Adsterra/Ezoic/AdSense code remaining
- Bot detection and scroll progress hooks removed (only used for ads)

