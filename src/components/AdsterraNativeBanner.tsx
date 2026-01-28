import { useEffect, useRef } from 'react';

interface AdsterraNativeBannerProps {
  className?: string;
}

export function AdsterraNativeBanner({ className }: AdsterraNativeBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current || !containerRef.current) return;

    // Check if container already has content (script already loaded)
    const containerId = 'container-784f975abdd60c86610b3cf2654a25b5';
    if (document.getElementById(containerId)?.hasChildNodes()) return;

    // Create and load the script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl28588760.effectivegatecpm.com/784f975abdd60c86610b3cf2654a25b5/invoke.js';
    
    containerRef.current.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      scriptLoadedRef.current = false;
    };
  }, []);

  return (
    <div className={className} ref={containerRef}>
      <div id="container-784f975abdd60c86610b3cf2654a25b5"></div>
    </div>
  );
}
