import { useEffect, useRef, memo } from 'react';
import { useAdVisibility } from '@/hooks/useAdVisibility';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    AdProvider?: Array<{ serve: Record<string, unknown> }>;
  }
}

interface RecommendationWidgetProps {
  className?: string;
}

/**
 * ExoClick Recommendation Widget (Zone 5838976) that displays native content recommendations.
 * Only shows to free users (non-premium subscribers).
 */
export const RecommendationWidget = memo(function RecommendationWidget({ 
  className 
}: RecommendationWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldShowAd, loading } = useAdVisibility();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!shouldShowAd || loading || initializedRef.current) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="ad-provider.js"]');
    
    if (!existingScript) {
      // Inject the ad-provider script
      const script = document.createElement('script');
      script.src = 'https://a.magsrv.com/ad-provider.js';
      script.async = true;
      script.type = 'application/javascript';
      document.head.appendChild(script);
      
      // Initialize AdProvider after script loads
      script.onload = () => {
        (window.AdProvider = window.AdProvider || []).push({ serve: {} });
      };
    } else {
      // Script exists, just initialize
      (window.AdProvider = window.AdProvider || []).push({ serve: {} });
    }
    
    initializedRef.current = true;

    return () => {
      initializedRef.current = false;
    };
  }, [shouldShowAd, loading]);

  // Don't render for premium users or while loading
  if (loading || !shouldShowAd) {
    return null;
  }

  return (
    <div className={cn("py-6 border-t border-border/50", className)}>
      <div className="flex flex-col items-center">
        {/* Label for transparency */}
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-3">
          Recommended For You
        </span>
        
        {/* Widget container */}
        <div 
          ref={containerRef}
          className="w-full flex justify-center"
        >
          <ins 
            className="eas6a97888e20" 
            data-zoneid="5838976"
            style={{ display: 'block', width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
});

export default RecommendationWidget;
