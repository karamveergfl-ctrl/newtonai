import { useEffect, useRef, memo } from 'react';
import { useAdVisibility } from '@/hooks/useAdVisibility';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  placement?: 'footer' | 'inline';
  className?: string;
}

/**
 * Banner ad component that displays responsive ads.
 * Desktop: 728x90, Mobile: 320x50
 * Only shows to free users (non-premium subscribers).
 */
export const AdBanner = memo(function AdBanner({ 
  placement = 'inline',
  className 
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldShowAd, loading } = useAdVisibility();
  const isMobile = useIsMobile();
  const hasInitializedRef = useRef(false);

  // Ad configuration based on device
  const adConfig = isMobile 
    ? { key: 'c5d398ab0a723a7cfa61f3c2d7960602', width: 320, height: 50 }
    : { key: 'c5d398ab0a723a7cfa61f3c2d7960602', width: 728, height: 90 };

  useEffect(() => {
    if (!shouldShowAd || loading) return;
    
    const container = containerRef.current;
    if (!container || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    // Clear any existing content
    container.innerHTML = '';

    // Create the atOptions script
    const optionsScript = document.createElement('script');
    optionsScript.innerHTML = `
      atOptions = {
        'key': '${adConfig.key}',
        'format': 'iframe',
        'height': ${adConfig.height},
        'width': ${adConfig.width},
        'params': {}
      };
    `;

    // Create the invoke script
    const invokeScript = document.createElement('script');
    invokeScript.src = `https://www.highperformanceformat.com/${adConfig.key}/invoke.js`;
    invokeScript.async = true;

    // Append scripts to container
    container.appendChild(optionsScript);
    container.appendChild(invokeScript);
  }, [shouldShowAd, loading, adConfig.key, adConfig.width, adConfig.height]);

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
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2">
        Advertisement
      </span>
      
      {/* Ad container */}
      <div 
        ref={containerRef}
        className="flex items-center justify-center overflow-hidden"
        style={{ 
          width: '100%',
          maxWidth: adConfig.width,
          minHeight: adConfig.height
        }}
      />
    </div>
  );
});

export default AdBanner;
