import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useCreditsContext } from "@/contexts/CreditsContext";
import { useStudyContext } from "@/contexts/StudyContext";
import { useBannerAd } from "@/contexts/BannerAdContext";
import { usePageHeight } from "@/hooks/usePageHeight";

type BannerPlacement = "A" | "B" | "C";

interface SmartBannerProps {
  placement: BannerPlacement;
  className?: string;
}

/**
 * SmartBanner Component
 * 
 * Implements hierarchical banner ad placement:
 * - Placement A: Always attempts to load (highest priority)
 * - Placement B: Only loads if A succeeded + page is ≥2x viewport
 * - Placement C: Only loads if A succeeded
 * 
 * Features:
 * - Premium user suppression
 * - Deep study mode suppression
 * - Lazy loading for B/C placements
 * - Iframe isolation for ad scripts
 * - "Sponsored" label ONLY after successful load
 * - 2500ms timeout safety - collapses if no content
 */
export function SmartBanner({ placement, className }: SmartBannerProps) {
  const { isPremium } = useCreditsContext();
  const { isInDeepStudy } = useStudyContext();
  const { placementALoaded, setPlacementALoaded, loadBannerAd } = useBannerAd();
  const { isLongPage } = usePageHeight();
  
  const [adHtml, setAdHtml] = useState<string | null>(null);
  const [isAdConfirmed, setIsAdConfirmed] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isConfirmedRef = useRef(false);

  // Determine if this placement should attempt to load
  const shouldAttempt = (() => {
    // Placement A always attempts
    if (placement === "A") return true;
    
    // B and C only attempt if A succeeded
    if (!placementALoaded) return false;
    
    // Placement B requires long page
    if (placement === "B" && !isLongPage) return false;
    
    return true;
  })();

  // Handle iframe load confirmation
  const handleIframeLoad = useCallback(() => {
    clearTimeout(timeoutRef.current);
    isConfirmedRef.current = true;
    setIsAdConfirmed(true);
    if (placement === "A") {
      setPlacementALoaded(true);
    }
  }, [placement, setPlacementALoaded]);

  // Setup IntersectionObserver for lazy loading (B and C)
  useEffect(() => {
    if (placement === "A" || !containerRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    
    observerRef.current.observe(containerRef.current);
    
    return () => observerRef.current?.disconnect();
  }, [placement]);

  // Load ad when conditions are met
  useEffect(() => {
    const load = async () => {
      // Skip if already attempted or conditions not met
      if (hasAttempted) return;
      if (isPremium || isInDeepStudy) return;
      if (!shouldAttempt) return;
      
      // For A: load immediately
      // For B/C: wait for visibility
      if (placement !== "A" && !isVisible) return;
      
      setHasAttempted(true);
      
      try {
        const response = await loadBannerAd();
        
        if (response.ad_html) {
          setAdHtml(response.ad_html);
          
          // Start 2500ms timeout - collapse if iframe doesn't load in time
          timeoutRef.current = setTimeout(() => {
            // Check ref, not state (avoids stale closure)
            if (!isConfirmedRef.current) {
              setAdHtml(null);
            }
          }, 2500);
        }
      } catch (error) {
        console.error(`SmartBanner ${placement} load error:`, error);
      }
    };
    
    load();
  }, [
    placement,
    shouldAttempt,
    isVisible,
    hasAttempted,
    isPremium,
    isInDeepStudy,
    loadBannerAd,
    isAdConfirmed,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Don't render for premium users
  if (isPremium) return null;
  
  // Don't render during deep study mode
  if (isInDeepStudy) return null;
  
  // Don't render if conditions not met
  if (!shouldAttempt) return null;

  // For B/C placements that haven't loaded yet, render a hidden ref container
  // so IntersectionObserver can detect visibility
  if (placement !== "A" && !isVisible && !hasAttempted) {
    return <div ref={containerRef} className="h-0 w-0" />;
  }

  // No ad content yet - render nothing
  if (!adHtml) return null;

  // Render iframe - but hide container until confirmed
  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full flex flex-col items-center my-6",
        !isAdConfirmed && "opacity-0 h-0 overflow-hidden",
        className
      )}
    >
      <span className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wider">
        Sponsored
      </span>
      
      <iframe
        srcDoc={adHtml}
        onLoad={handleIframeLoad}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="border-0 w-[728px] max-w-full h-[90px] overflow-hidden rounded-lg"
        title="Advertisement"
        loading={placement === "A" ? "eager" : "lazy"}
      />
    </div>
  );
}
