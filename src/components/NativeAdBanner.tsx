import { useEffect, useRef, useState } from "react";
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

// Generate the HTML content for the ad iframe
function generateAdHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
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
      
      {/* Ad iframe with srcDoc for isolated JavaScript context */}
      {isVisible && (
        <iframe
          srcDoc={generateAdHtml()}
          width={AD_WIDTH}
          height={AD_HEIGHT}
          style={{
            width: `${AD_WIDTH}px`,
            height: `${AD_HEIGHT}px`,
            border: "none",
            overflow: "hidden",
          }}
          scrolling="no"
          title={`Advertisement - ${placement}`}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
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
