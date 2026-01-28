import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AdsterraNativeBannerProps {
  className?: string;
  instanceId?: string;
}

export function AdsterraNativeBanner({ className, instanceId = 'default' }: AdsterraNativeBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current || !containerRef.current) return;

    // Create unique container ID for this instance
    const uniqueContainerId = `container-784f975abdd60c86610b3cf2654a25b5-${instanceId}`;
    
    // Find or create the ad container
    const adContainer = containerRef.current.querySelector(`#${uniqueContainerId}`);
    if (!adContainer) return;

    // Check if script already loaded for this container
    if (adContainer.hasChildNodes()) return;

    // Create and load the script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl28588760.effectivegatecpm.com/784f975abdd60c86610b3cf2654a25b5/invoke.js';
    
    // Append script to container
    adContainer.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      scriptLoadedRef.current = false;
    };
  }, [instanceId]);

  return (
    <div 
      className={cn(
        "w-full my-6 md:my-8 px-4 sm:px-0 overflow-hidden",
        className
      )} 
      ref={containerRef}
    >
      <div id={`container-784f975abdd60c86610b3cf2654a25b5-${instanceId}`}></div>
    </div>
  );
}
