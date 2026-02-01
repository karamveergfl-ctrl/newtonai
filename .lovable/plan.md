
# Plan: Ensure First Banner Ad Always Appears

## Problem Analysis

Based on investigation, there are two issues:

### Issue 1: Adsterra 403 Error (Domain Not Whitelisted)
The console logs show:
```
Failed to load resource: 403 (Forbidden) 
https://lozengehelped.com/c5d398ab0a723a7cfa61f3c2d7960602/invoke.js
```

This is an **Adsterra account configuration issue**, not a code problem. The preview domain (`*.lovableproject.com`) needs to be whitelisted in the Adsterra dashboard. 

**Action required**: Add the preview and production domains to your Adsterra account's allowed domains list.

### Issue 2: Ad Conditionally Hidden During Context Loading

The current `AdBanner` component can return `null` based on two conditions:
```tsx
if (isPremium || isInDeepStudy) return null;
```

While `isInDeepStudy` defaults to `false` (ads show), if the contexts are slow to initialize, there may be edge cases where the component renders before the context is ready.

---

## Solution: Create a Guaranteed "Hero" Ad Slot

Create a new `PrimaryAdBanner` component that:
1. **Always renders the ad container** (no conditional hiding for first placement)
2. **Only checks premium status after context is ready** (shows ad during loading)
3. **Has minimum height reserved** to prevent layout shift

### File Changes

#### 1. Create `src/components/PrimaryAdBanner.tsx`

```tsx
import { useCreditsContext } from "@/contexts/CreditsContext";
import { cn } from "@/lib/utils";

interface PrimaryAdBannerProps {
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

export function PrimaryAdBanner({ className }: PrimaryAdBannerProps) {
  const { isPremium, loading } = useCreditsContext();

  // Only hide for confirmed premium users (not during loading)
  // This ensures the first ad ALWAYS appears until we confirm premium status
  if (!loading && isPremium) return null;

  return (
    <div className={cn("w-full flex flex-col items-center my-6 min-h-[106px]", className)}>
      <span className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wider">
        Sponsored
      </span>
      <iframe
        srcDoc={AD_HTML}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="border-0 w-[728px] max-w-full h-[90px] overflow-hidden rounded-lg"
        title="Advertisement"
        loading="eager"
      />
    </div>
  );
}
```

**Key differences from standard `AdBanner`:**
- Uses `loading="eager"` to prioritize loading
- Has `min-h-[106px]` to reserve space and prevent layout shift
- Only hides for **confirmed** premium users (not during context loading)
- Does NOT check `isInDeepStudy` (first ad always shows)

#### 2. Update `src/pages/tools/AIQuiz.tsx`

Replace the first `AdBanner` with `PrimaryAdBanner`:

```tsx
// Import
import { PrimaryAdBanner } from "@/components/PrimaryAdBanner";

// In JSX - change line 327:
<PrimaryAdBanner />
```

#### 3. Apply Same Pattern to Other Tool Pages

Update the first ad placement in:
- `AIFlashcards.tsx`
- `AISummarizer.tsx`
- `AILectureNotes.tsx`
- `AIPodcast.tsx`
- `HomeworkHelp.tsx`
- `MindMap.tsx`

The `ToolPagePromoSections` can continue using regular `AdBanner` for secondary placements.

---

## Summary

| File | Action |
|------|--------|
| `src/components/PrimaryAdBanner.tsx` | CREATE - Guaranteed first-position ad |
| `src/pages/tools/AIQuiz.tsx` | UPDATE - Use PrimaryAdBanner |
| `src/pages/tools/AIFlashcards.tsx` | UPDATE - Use PrimaryAdBanner |
| `src/pages/tools/AISummarizer.tsx` | UPDATE - Use PrimaryAdBanner |
| `src/pages/tools/AILectureNotes.tsx` | UPDATE - Use PrimaryAdBanner |
| `src/pages/tools/AIPodcast.tsx` | UPDATE - Use PrimaryAdBanner |
| `src/pages/tools/HomeworkHelp.tsx` | UPDATE - Use PrimaryAdBanner |
| `src/pages/tools/MindMap.tsx` | UPDATE - Use PrimaryAdBanner |

---

## Technical Notes

### Adsterra Domain Whitelisting (Required)
You must add these domains in your Adsterra dashboard:
- `newtonai.lovable.app` (production)
- `*.lovableproject.com` (preview)

Without this, ads will continue returning 403 errors regardless of code changes.

### Reserved Space
The `min-h-[106px]` (90px ad + 16px label) prevents cumulative layout shift (CLS), which improves user experience and SEO scores.
