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
 * Builds isolated HTML document for Ezmob ad script.
 * Uses srcDoc to contain ad JavaScript in its own context.
 */
function buildEzmobAdHTML(zoneId: string): string {
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
          min-height: 250px;
          background: transparent;
        }
      </style>
    </head>
    <body>
      <script type="text/javascript">
        var __jscp = function() {
          for (var b = 0, a = window; a != a.parent;) ++b, a = a.parent;
          if (a = window.parent == window ? document.URL : document.referrer) {
            var c = a.indexOf("://");
            0 <= c && (a = a.substring(c + 3));
            c = a.indexOf("/");
            0 <= c && (a = a.substring(0, c))
          }
          var b = { pu: a, "if": b, rn: new Number(Math.floor(99999999 * Math.random()) + 1) }, a = [], d;
          for (d in b) a.push(d + "=" + encodeURIComponent(b[d]));
          return encodeURIComponent(a.join("&"))
        };
        document.write('<scr' + 'ipt type="text/javascript" src="//cpm.ezmob.com/tag?zone_id=${zoneId}&size=300x250&subid=&j=' + __jscp() + '"></scr' + 'ipt>');
      </script>
    </body>
    </html>
  `;
}

/**
 * Ezmob Banner Component
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
        srcDoc={buildEzmobAdHTML(adKey)}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="border-0 w-[300px] h-[250px] overflow-hidden"
        title="Advertisement"
        loading="lazy"
        onError={() => setAdError(true)}
      />
    </div>
  );
}
