import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useCreditsContext } from "@/contexts/CreditsContext";
import { useStudyContext } from "@/contexts/StudyContext";
import { useScrollProgress } from "@/hooks/useScrollProgress";

interface PropellerAdBannerProps {
  className?: string;
  adKey: string;
}

/**
 * Builds isolated HTML document for PropellerAds script.
 * Uses srcDoc to contain ad JavaScript in its own context.
 */
function buildPropellerAdHTML(adKey: string): string {
  return `
    <!DOCTYPE html>
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
      <div id="container-${adKey}"></div>
      <script async data-cfasync="false" 
        src="//pl.profitablegatecpm.com/${adKey}.js">
      </script>
    </body>
    </html>
  `;
}

/**
 * PropellerAds Banner Component
 * 
 * Features:
 * - User-initiated loading (50% scroll trigger)
 * - Premium user exclusion
 * - Deep study mode suppression
 * - Iframe isolation for safe JS execution
 * - Graceful failure handling
 */
export function PropellerAdBanner({ className, adKey }: PropellerAdBannerProps) {
  const { isPremium } = useCreditsContext();
  const { isInDeepStudy } = useStudyContext();
  const { hasReachedThreshold } = useScrollProgress(50);
  const [adError, setAdError] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const hasTriggered = useRef(false);

  // Only trigger once when threshold is first reached
  useEffect(() => {
    if (hasReachedThreshold && !hasTriggered.current) {
      hasTriggered.current = true;
      setShouldRender(true);
    }
  }, [hasReachedThreshold]);

  // Don't render for premium users
  if (isPremium) return null;
  
  // Don't render during deep study mode
  if (isInDeepStudy) return null;
  
  // Wait for scroll threshold (first trigger)
  if (!shouldRender) return null;
  
  // Hide if ad failed to load
  if (adError) return null;

  return (
    <div className={cn("w-full flex justify-center my-8", className)}>
      <iframe
        srcDoc={buildPropellerAdHTML(adKey)}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="border-0 w-full max-w-[728px] h-[90px] md:h-[90px] overflow-hidden"
        title="Advertisement"
        loading="lazy"
        onError={() => setAdError(true)}
      />
    </div>
  );
}
