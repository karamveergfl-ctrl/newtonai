import { useEffect, useRef, memo, useState } from 'react';
import { useAdVisibility } from '@/hooks/useAdVisibility';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  placement?: 'footer' | 'inline';
  className?: string;
}

/**
 * Banner ad component that displays a 728x90 HighPerformanceFormat ad.
 * Only shows to free users (non-premium subscribers).
 * Hides completely if ads fail to load (no empty labels).
 */
export const AdBanner = memo(function AdBanner({ 
  placement = 'inline',
  className 
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldShowAd, loading } = useAdVisibility();
  const [adLoaded, setAdLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const observerRef = useRef<MutationObserver | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Don't load ad script if user is premium or still loading
    if (!shouldShowAd || loading) return;
    
    const container = containerRef.current;
    if (!container || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    // Set timeout for load failure detection (8 seconds)
    timeoutRef.current = setTimeout(() => {
      if (!adLoaded) {
        setLoadFailed(true);
      }
    }, 8000);

    // Use MutationObserver to detect when iframe/content appears
    observerRef.current = new MutationObserver(() => {
      const hasContent = container.querySelector('iframe') || 
                         container.querySelector('img') ||
                         container.querySelector('[id^="aswift"]');
      if (hasContent) {
        setAdLoaded(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    });

    observerRef.current.observe(container, { 
      childList: true, 
      subtree: true 
    });

    // Inject scripts after a small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      // Create the atOptions script
      const optionsScript = document.createElement('script');
      optionsScript.innerHTML = `
        atOptions = {
          'key': 'c5d398ab0a723a7cfa61f3c2d7960602',
          'format': 'iframe',
          'height': 90,
          'width': 728,
          'params': {}
        };
      `;

      // Create the invoke script
      const invokeScript = document.createElement('script');
      invokeScript.src = 'https://www.highperformanceformat.com/c5d398ab0a723a7cfa61f3c2d7960602/invoke.js';
      invokeScript.async = true;
      
      invokeScript.onerror = () => {
        setLoadFailed(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      // Append scripts to container
      container.appendChild(optionsScript);
      container.appendChild(invokeScript);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [shouldShowAd, loading, adLoaded]);

  // Don't render anything for premium users, while loading, or if ad failed
  if (loading || !shouldShowAd || loadFailed) {
    return null;
  }

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-4",
        placement === 'footer' && "border-t border-border/50 bg-muted/30",
        placement === 'inline' && "my-6",
        // Hide the label until content actually loads
        !adLoaded && "opacity-0 h-0 overflow-hidden",
        className
      )}
    >
      {/* Advertisement label - only show when ad is loaded */}
      {adLoaded && (
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2">
          Advertisement
        </span>
      )}
      
      {/* Ad container */}
      <div 
        ref={containerRef}
        className="flex items-center justify-center w-full max-w-[728px] min-h-[90px] overflow-hidden"
        style={{ maxWidth: '100%' }}
      />
    </div>
  );
});

export default AdBanner;
