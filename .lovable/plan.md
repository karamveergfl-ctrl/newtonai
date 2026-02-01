
# Plan: Simplify Adsterra Banner Ads

## Problem Analysis

The current implementation has too much complexity that can cause ads to fail:

1. **Edge function round-trip** - Unnecessary since the ad HTML is static
2. **2500ms timeout** - May collapse ads before Adsterra's script loads
3. **Placement hierarchy (A→B→C)** - Over-engineered, adds failure points
4. **IntersectionObserver for lazy loading** - Conflicts with Adsterra's own loading
5. **Multiple state variables** - Creates race conditions and stale closures

## Solution: Direct Static Implementation

Replace the complex system with a simple, self-contained component that:
- Embeds the Adsterra script directly (no edge function call)
- No timeouts that can prematurely hide ads
- Simple premium/study mode checks
- Single component, no context provider needed

## Changes Required

### 1. Create Simple AdBanner Component

New file: `src/components/AdBanner.tsx`

```tsx
import { useCreditsContext } from "@/contexts/CreditsContext";
import { useStudyContext } from "@/contexts/StudyContext";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  className?: string;
}

const AD_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      display: flex; 
      justify-content: center; 
      align-items: center;
      min-height: 90px;
      background: transparent;
    }
  </style>
</head>
<body>
  <script>
    atOptions = {
      'key' : 'c5d398ab0a723a7cfa61f3c2d7960602',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script src="https://lozengehelped.com/c5d398ab0a723a7cfa61f3c2d7960602/invoke.js"></script>
</body>
</html>`;

export function AdBanner({ className }: AdBannerProps) {
  const { isPremium } = useCreditsContext();
  const { isInDeepStudy } = useStudyContext();

  // Hide for premium users or during deep study
  if (isPremium || isInDeepStudy) return null;

  return (
    <div className={cn("w-full flex flex-col items-center my-6", className)}>
      <span className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wider">
        Sponsored
      </span>
      <iframe
        srcDoc={AD_HTML}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="border-0 w-[728px] max-w-full h-[90px] overflow-hidden rounded-lg"
        title="Advertisement"
      />
    </div>
  );
}
```

### 2. Update All Existing Usages

Replace all `<SmartBanner placement="A|B|C" />` with `<AdBanner />` in:
- Tool pages (AIQuiz, AISummarizer, AIFlashcards, etc.)
- Landing pages (About, Blog, Compare pages)
- Promotional sections (ToolPagePromoSections)

### 3. Clean Up Unused Files (Optional)

These can be removed after migration:
- `src/components/SmartBanner.tsx`
- `src/components/AdsterraBanner.tsx`
- `src/contexts/BannerAdContext.tsx`
- `supabase/functions/get-banner-ad/index.ts`

## Why This Works

| Before | After |
|--------|-------|
| Edge function call + network latency | Inline static HTML |
| 2500ms timeout can kill ads | No timeout - let Adsterra load |
| Complex placement hierarchy | Simple: show or don't show |
| Multiple state variables | Zero state needed |
| Context provider overhead | Direct component |

## Technical Details

- **Ad Key**: `c5d398ab0a723a7cfa61f3c2d7960602`
- **Format**: 728x90 Leaderboard
- **Responsiveness**: `max-w-full` scales on mobile
- **Sandbox**: Scripts and popups allowed for ad functionality
- **Premium check**: Uses existing `useCreditsContext`
- **Study mode check**: Uses existing `useStudyContext`

## Files to Modify

| File | Action |
|------|--------|
| `src/components/AdBanner.tsx` | CREATE - New simple component |
| `src/pages/tools/AIQuiz.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/pages/tools/AISummarizer.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/pages/tools/AIFlashcards.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/pages/tools/AIPodcast.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/pages/tools/AILectureNotes.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/pages/tools/MindMap.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/pages/tools/HomeworkHelp.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/pages/About.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/pages/Blog.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/pages/compare/*.tsx` | UPDATE - Replace SmartBanner with AdBanner |
| `src/components/tool-sections/ToolPagePromoSections.tsx` | UPDATE - Replace SmartBanner with AdBanner |
