import { useEffect, useRef, memo, useState } from 'react';
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
 * Hides completely if no content loads (no empty labels).
 */
export const RecommendationWidget = memo(function RecommendationWidget({ 
  className 
}: RecommendationWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldShowAd, loading } = useAdVisibility();
  const [hasContent, setHasContent] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const hasInitializedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (!shouldShowAd || loading) return;
    
    const container = containerRef.current;
    if (!container || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    // Set timeout for load failure detection (8 seconds)
    timeoutRef.current = setTimeout(() => {
      if (!hasContent) {
        setLoadFailed(true);
      }
    }, 8000);

    // Use MutationObserver to detect when content appears
    observerRef.current = new MutationObserver(() => {
      // Check for actual ad content (not just the ins element)
      const insElement = container.querySelector('.eas6a97888e20');
      const hasAdContent = insElement && (
        insElement.querySelector('a') ||
        insElement.querySelector('img') ||
        insElement.querySelector('iframe') ||
        (insElement.children.length > 0 && insElement.innerHTML.length > 100)
      );
      
      if (hasAdContent) {
        setHasContent(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    });

    observerRef.current.observe(container, { 
      childList: true, 
      subtree: true,
      characterData: true
    });

    // Load the ad-provider script
    const existingScript = document.querySelector('script[src*="ad-provider.js"]');
    
    const initAdProvider = () => {
      // Use setTimeout to ensure DOM is fully ready
      setTimeout(() => {
        requestAnimationFrame(() => {
          try {
            (window.AdProvider = window.AdProvider || []).push({ serve: {} });
          } catch (e) {
            console.warn('AdProvider initialization failed:', e);
            setLoadFailed(true);
          }
        });
      }, 100);
    };
    
    if (!existingScript) {
      // Inject the ad-provider script
      const script = document.createElement('script');
      script.src = 'https://a.magsrv.com/ad-provider.js';
      script.async = true;
      script.type = 'application/javascript';
      
      script.onload = initAdProvider;
      script.onerror = () => {
        setLoadFailed(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
      
      document.head.appendChild(script);
    } else {
      // Script exists, just initialize
      initAdProvider();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [shouldShowAd, loading, hasContent]);

  // Don't render for premium users, while loading, or if load failed
  if (loading || !shouldShowAd || loadFailed) {
    return null;
  }

  return (
    <div 
      className={cn(
        "py-6 border-t border-border/50",
        // Hide until content actually loads
        !hasContent && "opacity-0 h-0 overflow-hidden",
        className
      )}
    >
      <div className="flex flex-col items-center">
        {/* Label - only show when content is loaded */}
        {hasContent && (
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-3">
            Recommended For You
          </span>
        )}
        
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
