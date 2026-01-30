import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/useCredits";
import { useStudyContext } from "@/contexts/StudyContext";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Generate the iframe srcdoc HTML
function generateAdHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: ${AD_WIDTH}px;
      height: ${AD_HEIGHT}px;
      background: transparent; 
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${ADSTERRA_KEY}',
      'format' : 'iframe',
      'height' : ${AD_HEIGHT},
      'width' : ${AD_WIDTH},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="//lozengehelped.com/${ADSTERRA_KEY}/invoke.js"></script>
</body>
</html>`;
}

export function NativeAdBanner({ 
  placement, 
  className 
}: NativeAdBannerProps) {
  const { isPremium } = useCredits();
  const { isInDeepStudy } = useStudyContext();
  const isMobile = useIsMobile();
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Set up timeout for iframe load failure detection
  useEffect(() => {
    if (!isVisible) return;

    // Set a 5-second timeout for ad load
    timeoutRef.current = setTimeout(() => {
      if (!isLoaded) {
        setHasError(true);
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, isLoaded]);

  const handleIframeLoad = () => {
    setIsLoaded(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleIframeError = () => {
    setHasError(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Hide if there was an error loading
  if (hasError) return null;

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
      
      {/* Only render iframe when visible (for lazy loading) */}
      {isVisible && (
        <iframe
          srcDoc={generateAdHtml()}
          title="Sponsored content"
          style={{
            width: `${AD_WIDTH}px`,
            height: `${AD_HEIGHT}px`,
            border: "none",
            overflow: "hidden",
            background: "transparent",
            display: "block",
          }}
          scrolling="no"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
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
