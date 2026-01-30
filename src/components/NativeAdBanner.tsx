import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NativeAdBannerProps {
  placement: "below-action" | "mid-page" | "above-footer";
  className?: string;
  lazyLoad?: boolean;
}

// Adsterra Native Banner Zone ID
const ADSTERRA_ZONE_ID = "784f975abdd60c86610b3cf2654a25b5";
const ADSTERRA_SCRIPT_URL = `https://lozengehelped.com/${ADSTERRA_ZONE_ID}/invoke.js`;

export function NativeAdBanner({ 
  placement, 
  className,
  lazyLoad = true 
}: NativeAdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isLoaded, setIsLoaded] = useState(false);
  const scriptLoadedRef = useRef(false);

  // Lazy load using Intersection Observer
  useEffect(() => {
    if (!lazyLoad || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: "200px", // Start loading 200px before visible
        threshold: 0 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad, isVisible]);

  // Load ad script when visible
  useEffect(() => {
    if (!isVisible || scriptLoadedRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const adContainerId = `container-${ADSTERRA_ZONE_ID}-${placement}`;

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
      setIsLoaded(true);
      scriptLoadedRef.current = true;
    };

    script.onerror = () => {
      // Silently fail - don't show empty container
      container.style.display = "none";
    };

    container.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (container) {
        container.innerHTML = "";
      }
      scriptLoadedRef.current = false;
    };
  }, [isVisible, placement]);

  // Don't render container until lazy load triggers
  if (lazyLoad && !isVisible) {
    return (
      <div 
        ref={containerRef} 
        className={cn("min-h-[1px] w-full", className)}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full my-6 md:my-8",
        "flex items-center justify-center",
        // Natural spacing that matches content flow
        placement === "below-action" && "mt-8",
        placement === "mid-page" && "my-10",
        placement === "above-footer" && "mb-6",
        className
      )}
      data-ad-placement={placement}
      aria-label="Advertisement"
    >
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
