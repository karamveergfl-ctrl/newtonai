import { useEffect, useRef, useState, useId } from "react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/useCredits";
import { useStudyContext } from "@/contexts/StudyContext";

interface NativeAdBannerProps {
  placement: "below-action" | "mid-page" | "above-footer";
  className?: string;
}

// Adsterra Banner Ad - 728x90 Leaderboard
const ADSTERRA_KEY = "c5d398ab0a723a7cfa61f3c2d7960602";
const AD_WIDTH = 728;
const AD_HEIGHT = 90;

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
  const uniqueId = useId();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  // Lazy load for mid-page and above-footer only
  const shouldLazyLoad = placement !== "below-action";
  const { ref: lazyRef, isVisible } = useLazyAdLoad({ 
    enabled: shouldLazyLoad, 
    rootMargin: "300px" 
  });

  // Generate unique container ID for this ad placement
  const containerId = `adsterra-${placement}-${uniqueId.replace(/:/g, "")}`;

  // Inject Adsterra script when visible
  useEffect(() => {
    if (!isVisible || isPremium || isInDeepStudy) return;
    
    const container = adContainerRef.current;
    if (!container) return;

    // Clear any existing content
    container.innerHTML = "";

    // Create and inject the atOptions script
    const optionsScript = document.createElement("script");
    optionsScript.type = "text/javascript";
    optionsScript.text = `
      atOptions = {
        'key' : '${ADSTERRA_KEY}',
        'format' : 'iframe',
        'height' : ${AD_HEIGHT},
        'width' : ${AD_WIDTH},
        'params' : {}
      };
    `;
    container.appendChild(optionsScript);

    // Create and inject the invoke.js script
    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = `//lozengehelped.com/${ADSTERRA_KEY}/invoke.js`;
    invokeScript.async = true;
    invokeScript.onload = () => setAdLoaded(true);
    invokeScript.onerror = () => console.warn(`Adsterra ad failed to load for placement: ${placement}`);
    container.appendChild(invokeScript);

    // Cleanup on unmount
    return () => {
      if (container) {
        container.innerHTML = "";
      }
      setAdLoaded(false);
    };
  }, [isVisible, isPremium, isInDeepStudy, placement, containerId]);

  // Don't show ads to premium users
  if (isPremium) return null;

  // Don't show ads during deep study mode (quiz, solutions, etc.)
  if (isInDeepStudy) return null;

  return (
    <div
      ref={lazyRef}
      className={cn(
        // Base spacing
        "w-full py-4 md:py-6 my-6 md:my-8",
        // Match page background
        "bg-background",
        // Match card border radius
        "rounded-xl",
        // Center content
        "flex flex-col items-center justify-center",
        // Handle overflow for fixed 728px banner on small screens
        "overflow-hidden",
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
      
      {/* Ad container - script will be injected here */}
      {isVisible && (
        <div
          id={containerId}
          ref={adContainerRef}
          style={{
            width: `${AD_WIDTH}px`,
            height: `${AD_HEIGHT}px`,
            minWidth: `${AD_WIDTH}px`,
            minHeight: `${AD_HEIGHT}px`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      )}
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
