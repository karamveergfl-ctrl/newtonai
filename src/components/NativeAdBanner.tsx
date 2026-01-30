import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/useCredits";
import { useStudyContext } from "@/contexts/StudyContext";

interface NativeAdBannerProps {
  placement: "below-action" | "mid-page" | "above-footer";
  className?: string;
}

// Adsterra Native Banner Zone ID - SINGLE unit for all placements
const ADSTERRA_ZONE_ID = "784f975abdd60c86610b3cf2654a25b5";
const ADSTERRA_SCRIPT_URL = `https://lozengehelped.com/${ADSTERRA_ZONE_ID}/invoke.js`;

// Custom hook for lazy loading ads
function useLazyAdLoad({ enabled, rootMargin = "300px" }: { enabled: boolean; rootMargin?: string }) {
  const [isVisible, setIsVisible] = useState(!enabled);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    if (!ref.current) return;

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

export function NativeAdBanner({ 
  placement, 
  className 
}: NativeAdBannerProps) {
  const { isPremium } = useCredits();
  const { isInDeepStudy } = useStudyContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [hasError, setHasError] = useState(false);

  // Lazy load for mid-page and above-footer only
  const shouldLazyLoad = placement !== "below-action";
  const { ref: lazyRef, isVisible } = useLazyAdLoad({ 
    enabled: shouldLazyLoad, 
    rootMargin: "300px" 
  });

  // Don't show ads to premium users
  if (isPremium) return null;

  // Don't show ads during deep study mode (quiz, solutions, etc.)
  if (isInDeepStudy) return null;

  // Load ad script when visible
  useEffect(() => {
    if (!isVisible || scriptLoadedRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const adContainerId = `container-${ADSTERRA_ZONE_ID}-${placement}-${Date.now()}`;

    // Create unique container for this placement
    const adContainer = document.createElement("div");
    adContainer.id = adContainerId;
    container.appendChild(adContainer);

    // Load the script
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = ADSTERRA_SCRIPT_URL;
    
    script.onload = () => {
      scriptLoadedRef.current = true;
    };

    script.onerror = () => {
      // Silently fail - hide container on error
      setHasError(true);
    };

    container.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (container) {
        container.innerHTML = "";
      }
      scriptLoadedRef.current = false;
    };
  }, [placement, isVisible]);

  // Hide if there was an error loading
  if (hasError) return null;

  return (
    <div
      ref={(node) => {
        // Combine refs for lazy loading and container
        if (shouldLazyLoad) {
          (lazyRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        // Base spacing - 24-32px margins
        "w-full py-6 md:py-8 my-6 md:my-8",
        // Match page background
        "bg-background",
        // Match card border radius
        "rounded-xl",
        // Center content
        "flex flex-col items-center justify-center",
        // Placement-specific spacing
        placement === "below-action" && "mt-8",
        placement === "mid-page" && "my-10",
        placement === "above-footer" && "mb-8",
        className
      )}
      data-ad-placement={placement}
      aria-label="Sponsored content"
    >
      {/* Subtle "Sponsored" label */}
      <span className="text-[10px] text-muted-foreground/60 mb-2 tracking-wide uppercase">
        Sponsored
      </span>
      {/* Ad content will be injected here by the script */}
    </div>
  );
}

// Hook to check if page is tall enough for mid-page ad
export function useCanShowMidPageAd() {
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      const viewportHeight = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      setCanShow(pageHeight >= viewportHeight * 2);
    };

    checkHeight();
    
    // Recheck on resize and content changes
    window.addEventListener("resize", checkHeight);
    const observer = new ResizeObserver(checkHeight);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("resize", checkHeight);
      observer.disconnect();
    };
  }, []);

  return canShow;
}
