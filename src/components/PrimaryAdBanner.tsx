import { useEffect, useRef } from "react";
import { useCreditsContext } from "@/contexts/CreditsContext";
import { cn } from "@/lib/utils";

interface PrimaryAdBannerProps {
  className?: string;
}

export function PrimaryAdBanner({ className }: PrimaryAdBannerProps) {
  const { isPremium, loading } = useCreditsContext();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Load immediately - no delay for primary ad slot
    if (scriptLoaded.current || !adContainerRef.current) return;
    if (!loading && isPremium) return;
    
    scriptLoaded.current = true;

    (window as any).atOptions = {
      key: 'fe9d10672684b2efb3db57ecdb954f85',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    };

    const script = document.createElement('script');
    script.src = 'https://lozengehelped.com/fe9d10672684b2efb3db57ecdb954f85/invoke.js';
    script.async = true;
    adContainerRef.current.appendChild(script);

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, [isPremium, loading]);

  if (!loading && isPremium) return null;

  return (
    <div className={cn("w-full flex flex-col items-center my-6 min-h-[106px]", className)}>
      <span className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wider">
        Sponsored
      </span>
      <div 
        ref={adContainerRef}
        className="w-[728px] max-w-full h-[90px] flex items-center justify-center rounded-lg"
      />
    </div>
  );
}
