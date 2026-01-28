import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AdsterraNativeBannerProps {
  className?: string;
  instanceId?: string; // Kept for backwards compatibility
}

export function AdsterraNativeBanner({ className }: AdsterraNativeBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if script already exists globally
    const scriptId = 'adsterra-native-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl28588760.effectivegatecpm.com/784f975abdd60c86610b3cf2654a25b5/invoke.js';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div 
      className={cn(
        "w-full my-6 md:my-8 px-4 sm:px-0 overflow-hidden",
        className
      )} 
      ref={containerRef}
    >
      <div id="container-784f975abdd60c86610b3cf2654a25b5"></div>
    </div>
  );
}
