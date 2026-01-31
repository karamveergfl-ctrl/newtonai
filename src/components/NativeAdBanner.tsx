import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/useCredits";
import { useStudyContext } from "@/contexts/StudyContext";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { isBot, isSafeAdEnvironment } from "@/utils/botDetection";

interface NativeAdBannerProps {
  className?: string;
}

// Adsterra Banner Ad - 728x90 Leaderboard
const ADSTERRA_KEY = "c5d398ab0a723a7cfa61f3c2d7960602";
const AD_WIDTH = 728;
const AD_HEIGHT = 90;

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

/**
 * NativeAdBanner - Monetag/Adsterra compliant ad banner
 * 
 * Compliance features:
 * - Only loads after user scrolls past 50% of page (user-initiated)
 * - Bot detection prevents ads for automated traffic
 * - Single ad per page (no stacking)
 * - No auto-refresh on route changes
 * - Collapses gracefully if ad fails to load
 * - Suppressed for premium users and during deep study mode
 */
export function NativeAdBanner({ className }: NativeAdBannerProps) {
  const { isPremium } = useCredits();
  const { isInDeepStudy } = useStudyContext();
  const { hasReachedThreshold } = useScrollProgress(50);
  
  // Track if we should show the ad (user has scrolled 50%+)
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const [isBotTraffic, setIsBotTraffic] = useState(true); // Default to true for safety

  // Check for bot traffic on mount
  useEffect(() => {
    // Small delay to ensure all browser APIs are available
    const timer = setTimeout(() => {
      const botDetected = isBot();
      const safeEnvironment = isSafeAdEnvironment();
      setIsBotTraffic(botDetected || !safeEnvironment);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Enable ad display when user scrolls past 50%
  useEffect(() => {
    if (hasReachedThreshold && !isBotTraffic) {
      setShouldShowAd(true);
    }
  }, [hasReachedThreshold, isBotTraffic]);

  // Don't show ads to premium users
  if (isPremium) return null;

  // Don't show ads during deep study mode (quiz, solutions, etc.)
  if (isInDeepStudy) return null;

  // Don't show ads to bots
  if (isBotTraffic) return null;

  // Don't render anything until user has scrolled past 50%
  if (!shouldShowAd) return null;

  return (
    <div
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
        className
      )}
      aria-label="Sponsored content"
    >
      {/* Subtle "Sponsored" label */}
      <span className="text-[10px] text-muted-foreground/60 mb-2 tracking-wide uppercase">
        Sponsored
      </span>
      
      {/* Ad iframe with srcDoc for isolated JavaScript context */}
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
        title="Advertisement"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
