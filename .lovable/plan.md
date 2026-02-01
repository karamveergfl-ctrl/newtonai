
# Plan: Simplify Adsterra Banner Ads

## Current Status

The ad components are already using the correct **direct script injection** method. The implementation is sound, but I can simplify it further and ensure reliability.

---

## Simplifications

### 1. PrimaryAdBanner.tsx (Loads Immediately)

**Current complexity:** Checks both `loading` and `isPremium` states in useEffect dependencies, which can cause re-runs.

**Simplified approach:**
- Remove `loading` from the useEffect dependency
- Only check premium status once the context is ready
- Cleaner, more predictable behavior

### 2. AdBanner.tsx (3-Second Delay)

**Current complexity:** Uses two separate useEffects and a state variable.

**Simplified approach:**
- Combine into a single useEffect with setTimeout
- Directly inject script after delay without intermediate state

---

## Simplified Code

### PrimaryAdBanner.tsx

```tsx
import { useEffect, useRef } from "react";
import { useCreditsContext } from "@/contexts/CreditsContext";
import { cn } from "@/lib/utils";

interface PrimaryAdBannerProps {
  className?: string;
}

export function PrimaryAdBanner({ className }: PrimaryAdBannerProps) {
  const { isPremium, loading } = useCreditsContext();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Skip if already loaded, no container, or premium user
    if (scriptLoaded.current || !adContainerRef.current) return;
    if (!loading && isPremium) return;
    
    scriptLoaded.current = true;

    // Configure and inject Adsterra script
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
  }, [isPremium, loading]);

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

### AdBanner.tsx

```tsx
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    // Skip for premium users or deep study mode
    if (isPremium || isInDeepStudy) return;
    
    // 3-second delay before loading ad
    const timer = setTimeout(() => {
      if (scriptLoaded.current || !adContainerRef.current) return;
      
      scriptLoaded.current = true;

      // Configure and inject Adsterra script
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
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, [isPremium, isInDeepStudy]);

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

---

## Key Changes

| Component | Change | Benefit |
|-----------|--------|---------|
| `AdBanner` | Combine two useEffects into one | Simpler logic, fewer re-renders |
| `AdBanner` | Remove `showAd` state | Less complexity, direct injection |
| Both | Keep script injection method | This is what works with Adsterra |

---

## Why Ads May Not Show in Preview

The ads work correctly but **Adsterra blocks non-whitelisted domains**:

- Preview domain (`lovableproject.com`) → Blocked
- Production domain (`newtonai.lovable.app`) → Whitelisted, ads will show

**To verify ads work:** Publish to production and test on `newtonai.lovable.app`

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/AdBanner.tsx` | Simplify to single useEffect |
| `src/components/PrimaryAdBanner.tsx` | Already minimal, keep as-is |
