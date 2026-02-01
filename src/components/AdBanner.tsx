import { useEffect, useRef, useState } from "react";
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
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    // 3-second delay before loading ad
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showAd || scriptLoaded.current || !adContainerRef.current) return;
    if (isPremium || isInDeepStudy) return;
    
    scriptLoaded.current = true;

    // Set atOptions on window BEFORE loading script
    (window as any).atOptions = {
      key: 'fe9d10672684b2efb3db57ecdb954f85',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    };

    // Create and inject script
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
  }, [showAd, isPremium, isInDeepStudy]);

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
