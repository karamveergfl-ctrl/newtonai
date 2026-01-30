

## Plan: Optimize Native Ad System for Maximum Revenue

### Overview

This plan implements your 10-point ad optimization strategy by:
1. Using a SINGLE Adsterra native ad unit across all placements
2. Adding lazy loading for mid-page and footer ads
3. Hiding ads for premium users
4. Suppressing ads during active study interactions
5. Improving styling with proper spacing and optional "Sponsored" label

---

### Part 1: Enhanced NativeAdBanner Component

**File: `src/components/NativeAdBanner.tsx`**

Key Changes:
- **Single Ad Unit**: Use ONE zone ID (already `784f975abdd60c86610b3cf2654a25b5`) for all placements - Adsterra handles rotation
- **Smart Lazy Loading**: Load `below-action` immediately, lazy-load `mid-page` and `above-footer` when within 300px of viewport
- **Premium User Hide**: Skip rendering entirely for premium subscribers
- **Improved Styling**:
  - 24-32px margins (top and bottom)
  - Same background as page
  - Border radius matching cards
  - Subtle "Sponsored" label instead of "Advertisement"
- **No Auto-refresh**: One impression per placement per page load

```tsx
// Pseudo-code structure
interface NativeAdBannerProps {
  placement: "below-action" | "mid-page" | "above-footer";
  className?: string;
}

export function NativeAdBanner({ placement, className }: NativeAdBannerProps) {
  const { isPremium } = useCredits();
  
  // Don't show ads to premium users
  if (isPremium) return null;
  
  // Lazy load for mid-page and above-footer only
  const shouldLazyLoad = placement !== "below-action";
  const isVisible = useLazyAdLoad({ enabled: shouldLazyLoad, rootMargin: "300px" });
  
  // Render ad when visible (or immediately for below-action)
  ...
}
```

---

### Part 2: Study Context Ad Suppression

**New Hook: `src/hooks/useStudyContext.tsx`**

Create a context to track when users are in "deep study" mode where ads should be suppressed:

- Quiz is active (questions visible)
- Solution steps are being displayed
- Timer is running
- PDF viewer is in focus

Pages/components will set this context, and NativeAdBanner will check it.

```tsx
// Components that set study context:
// - QuizMode.tsx → isActive = true
// - StepBySolutionRenderer.tsx → when visible
// - PDFChatSplitView.tsx → when in viewer
```

---

### Part 3: Update All Page Integrations

Current placements are good. Updates needed:

| Page | Current | Change |
|------|---------|--------|
| Landing Page | 1 ad (above-footer) | Keep - lazy load it |
| About | 1 ad (above-footer) | Keep - lazy load it |
| Blog | 2 ads | Keep - lazy load footer |
| BlogPost | 1 ad | Keep - lazy load it |
| Contact | 1 ad | Keep - lazy load it |
| FAQ | 1 ad | Keep - lazy load it |
| Tools Index | 1 ad | Keep - lazy load it |
| Enterprise | 1 ad | Keep - lazy load it |
| Pricing | 1 ad | Keep - lazy load it |
| Credits | 0 ads | **Add 1 ad** below feature costs (for non-premium only) |
| Tool Pages | 3 ads via PromoSections | Keep configuration |

---

### Part 4: Files to Modify

1. **`src/components/NativeAdBanner.tsx`** - Complete rewrite with:
   - Premium user detection
   - Lazy loading for mid-page/footer placements
   - Improved spacing (24-32px margins)
   - Subtle "Sponsored" label
   - Study context awareness

2. **`src/contexts/StudyContext.tsx`** (NEW) - Create context for tracking deep study mode

3. **`src/components/QuizMode.tsx`** - Set study context when quiz is active

4. **`src/components/InlineSolutionPanel.tsx`** - Set study context when showing solutions

5. **`src/pages/Credits.tsx`** - Add NativeAdBanner below Feature Credit Costs section (non-premium only)

6. **`src/App.tsx`** - Wrap app with StudyContextProvider

---

### Technical Implementation Details

#### Lazy Loading Implementation

```tsx
function useLazyAdLoad({ enabled, rootMargin = "300px" }) {
  const [isVisible, setIsVisible] = useState(!enabled);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!enabled || !ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);
  
  return { ref, isVisible };
}
```

#### Premium Detection

```tsx
// Already available via useCredits hook
const { isPremium } = useCredits();
if (isPremium) return null; // No ads for premium users
```

#### Improved Styling

```tsx
<div className={cn(
  // Base spacing - 24-32px margins
  "w-full py-6 md:py-8 my-6 md:my-8",
  // Match page background
  "bg-background",
  // Match card border radius
  "rounded-xl",
  // Center content
  "flex flex-col items-center justify-center",
  // Conditional placement spacing
  placement === "below-action" && "mt-8",
  placement === "mid-page" && "my-10",
  placement === "above-footer" && "mb-8",
)}>
  {/* Subtle "Sponsored" label */}
  <span className="text-[10px] text-muted-foreground/60 mb-2 tracking-wide uppercase">
    Sponsored
  </span>
  {/* Ad container */}
  <div id={`container-${ZONE_ID}`} />
</div>
```

---

### What This Plan Does NOT Change

- **Ad Network**: Stays with Adsterra only (no Monetag fallback needed based on your optimization)
- **Zone ID**: Continues using single zone `784f975abdd60c86610b3cf2654a25b5`
- **Max Placements**: Maintains 3 ads per page maximum
- **Exclusion Areas**: PDF viewer, quiz questions, and solutions remain ad-free

---

### Expected Improvements

Based on your optimization guide:
- **Lazy loading**: 15-30% RPM improvement
- **Premium user hiding**: Better user retention, more total impressions over time
- **Study context suppression**: Higher retention = more sessions = more impressions
- **Improved styling**: Higher CTR due to trust
- **Single ad unit**: Better bid competition, optimized creative rotation

