import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AdsterraBannerProps {
  className?: string;
}

export function AdsterraBanner({ className }: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current || !containerRef.current) return;
    
    // Set atOptions on window
    (window as any).atOptions = {
      'key': 'c5d398ab0a723a7cfa61f3c2d7960602',
      'format': 'iframe',
      'height': 90,
      'width': 728,
      'params': {}
    };

    // Create and append the script
    const script = document.createElement('script');
    script.src = 'https://rubbingsticksforthwith.com/c5d398ab0a723a7cfa61f3c2d7960602/invoke.js';
    script.async = true;
    
    containerRef.current.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      // Cleanup on unmount
      if (containerRef.current && script.parentNode === containerRef.current) {
        containerRef.current.removeChild(script);
      }
      scriptLoadedRef.current = false;
    };
  }, []);

  return (
    <div 
      className={cn(
        "w-full my-6 md:my-8 flex justify-center overflow-hidden",
        className
      )} 
      ref={containerRef}
    >
      {/* Adsterra 728x90 banner will be injected here */}
    </div>
  );
}
