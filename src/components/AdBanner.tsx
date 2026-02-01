import { useEffect, useRef } from "react";
import { useCreditsContext } from "@/contexts/CreditsContext";
import { useStudyContext } from "@/contexts/StudyContext";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className }: AdBannerProps) {
  const { isPremium } = useCreditsContext();
  const { isInDeepStudy } = useStudyContext();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Skip for premium users or deep study mode
    if (isPremium || isInDeepStudy) return;
    
    // 3-second delay before loading ad
    const timer = setTimeout(() => {
      if (scriptLoaded.current || !adContainerRef.current) return;
      
      scriptLoaded.current = true;

      // Configure and inject Adsterra script
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
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, [isPremium, isInDeepStudy]);

  // Hide for premium users or during deep study
  if (isPremium || isInDeepStudy) return null;

  return (
    <div className={cn("w-full flex flex-col items-center my-6", className)}>
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
