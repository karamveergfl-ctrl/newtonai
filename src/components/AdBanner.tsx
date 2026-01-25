import { useEffect, useRef, memo } from 'react';
import { useAdVisibility } from '@/hooks/useAdVisibility';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  placement?: 'footer' | 'inline';
  className?: string;
}

/**
 * Banner ad component that displays a 728x90 HighPerformanceFormat ad.
 * Only shows to free users (non-premium subscribers).
 */
export const AdBanner = memo(function AdBanner({ 
  placement = 'inline',
  className 
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldShowAd, loading } = useAdVisibility();
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Don't load ad script if user is premium or still loading
    if (!shouldShowAd || loading || scriptLoadedRef.current) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

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

    // Append scripts to container
    container.appendChild(optionsScript);
    container.appendChild(invokeScript);
    scriptLoadedRef.current = true;

    return () => {
      // Cleanup on unmount
      if (container) {
        container.innerHTML = '';
      }
      scriptLoadedRef.current = false;
    };
  }, [shouldShowAd, loading]);

  // Don't render anything for premium users or while loading
  if (loading || !shouldShowAd) {
    return null;
  }

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-4",
        placement === 'footer' && "border-t border-border/50 bg-muted/30",
        placement === 'inline' && "my-6",
        className
      )}
    >
      {/* Advertisement label for transparency */}
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2">
        Advertisement
      </span>
      
      {/* Ad container - responsive sizing */}
      <div 
        ref={containerRef}
        className="flex items-center justify-center w-full max-w-[728px] min-h-[90px] overflow-hidden"
        style={{ maxWidth: '100%' }}
      />
    </div>
  );
});

export default AdBanner;
