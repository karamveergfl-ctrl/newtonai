

# Plan: Fix Ads with 3-Second Delayed Loading

## Summary

I'll rewrite the ad components to use **direct script injection** (which actually works with Adsterra) combined with a **3-second delay** after the user reaches the page, exactly like how it worked when you first connected Adsterra.

---

## The Problem

The current implementation has two issues:

1. **iframe + srcDoc + sandbox** blocks Adsterra's script from creating its nested iframe (ads don't render)
2. No delay mechanism - ads try to load immediately but fail silently

---

## Solution

Replace the iframe approach with **direct DOM script injection** using React hooks, wrapped in a **3-second setTimeout**.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AdBanner.tsx` | Complete rewrite with direct injection + 3s delay |
| `src/components/PrimaryAdBanner.tsx` | Complete rewrite with direct injection + 3s delay |

---

## New Implementation

### AdBanner.tsx

```tsx
import { useEffect, useRef, useState } from "react";
import { useCreditsContext } from "@/contexts/CreditsContext";
import { useStudyContext } from "@/contexts/StudyContext";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className }: AdBannerProps) {
  const { isPremium } = useCreditsContext();
  const { isInDeepStudy } = useStudyContext();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    // 3-second delay before loading ad
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showAd || scriptLoaded.current || !adContainerRef.current) return;
    if (isPremium || isInDeepStudy) return;
    
    scriptLoaded.current = true;

    // Set atOptions on window BEFORE loading script
    (window as any).atOptions = {
      key: 'fe9d10672684b2efb3db57ecdb954f85',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    };

    // Create and inject script
    const script = document.createElement('script');
    script.src = 'https://lozengehelped.com/fe9d10672684b2efb3db57ecdb954f85/invoke.js';
    script.async = true;
    adContainerRef.current.appendChild(script);

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, [showAd, isPremium, isInDeepStudy]);

  // Hide for premium users or during deep study
  if (isPremium || isInDeepStudy) return null;

  return (
    <div className={cn("w-full flex flex-col items-center my-6", className)}>
      <span className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wider">
        Sponsored
      </span>
      <div 
        ref={adContainerRef}
        className="w-[728px] max-w-full h-[90px] flex items-center justify-center rounded-lg"
      />
    </div>
  );
}
```

### PrimaryAdBanner.tsx

Same pattern but without `isInDeepStudy` suppression (stays visible during loading to maximize fill rate):

```tsx
import { useEffect, useRef, useState } from "react";
import { useCreditsContext } from "@/contexts/CreditsContext";
import { cn } from "@/lib/utils";

interface PrimaryAdBannerProps {
  className?: string;
}

export function PrimaryAdBanner({ className }: PrimaryAdBannerProps) {
  const { isPremium, loading } = useCreditsContext();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    // 3-second delay before loading ad
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showAd || scriptLoaded.current || !adContainerRef.current) return;
    if (!loading && isPremium) return;
    
    scriptLoaded.current = true;

    (window as any).atOptions = {
      key: 'fe9d10672684b2efb3db57ecdb954f85',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    };

    const script = document.createElement('script');
    script.src = 'https://lozengehelped.com/fe9d10672684b2efb3db57ecdb954f85/invoke.js';
    script.async = true;
    adContainerRef.current.appendChild(script);

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, [showAd, isPremium, loading]);

  if (!loading && isPremium) return null;

  return (
    <div className={cn("w-full flex flex-col items-center my-6 min-h-[106px]", className)}>
      <span className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wider">
        Sponsored
      </span>
      <div 
        ref={adContainerRef}
        className="w-[728px] max-w-full h-[90px] flex items-center justify-center rounded-lg"
      />
    </div>
  );
}
```

---

## How It Works

1. **User lands on page** → Component mounts, starts 3-second timer
2. **After 3 seconds** → `setShowAd(true)` triggers the second useEffect
3. **Script injection** → Sets `window.atOptions` and appends the invoke.js script directly to the DOM
4. **Adsterra renders** → The script creates its iframe inside the container div
5. **Cleanup on unmount** → Properly removes script when navigating away

---

## Why This Fixes the Issue

| Problem | Solution |
|---------|----------|
| Sandbox blocking script execution | Direct injection bypasses sandbox |
| No 3-second delay | setTimeout provides exact delay |
| Silent failures | Script runs in main document context |
| No ad appearing | Direct DOM injection is Adsterra's recommended method |

---

## Expected Result

- User visits `/tools/quiz`
- "Sponsored" label appears immediately (placeholder)
- After exactly 3 seconds, the Adsterra ad loads and displays
- Works on all pages across the app
- Premium users and deep study mode still hide ads

