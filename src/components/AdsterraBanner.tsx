import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useCreditsContext } from "@/contexts/CreditsContext";
import { useStudyContext } from "@/contexts/StudyContext";
import { useScrollProgress } from "@/hooks/useScrollProgress";

interface AdsterraBannerProps {
  className?: string;
}

/**
 * Builds isolated HTML document for Adsterra ad script.
 * Uses srcDoc to contain ad JavaScript in its own context.
 */
function buildAdsterraAdHTML(adKey: string): string {
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
      <script>
        atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      </script>
      <script src="https://lozengehelped.com/${adKey}/invoke.js"></script>
    </body>
    </html>
  `;
}

/**
 * Adsterra Banner Component (300x250)
 * 
 * Features:
 * - User-initiated loading (50% scroll trigger)
 * - Premium user exclusion
 * - Deep study mode suppression
 * - Iframe isolation for safe JS execution
 * - Graceful failure handling
 */
export function AdsterraBanner({ className }: AdsterraBannerProps) {
  const { isPremium } = useCreditsContext();
  const { isInDeepStudy } = useStudyContext();
  const { hasReachedThreshold } = useScrollProgress(50);
  const [adError, setAdError] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const hasTriggered = useRef(false);

  const adKey = "c5d398ab0a723a7cfa61f3c2d7960602";

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
        srcDoc={buildAdsterraAdHTML(adKey)}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="border-0 w-[728px] max-w-full h-[90px] overflow-hidden"
        title="Advertisement"
        loading="lazy"
        onError={() => setAdError(true)}
      />
    </div>
  );
}
