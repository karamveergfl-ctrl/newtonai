import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Extend Window interface to include Ezoic globals
declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      showAds: (...placementIds: number[]) => void;
    };
  }
}

interface EzoicAdPlaceholderProps {
  placementId: number;
  placement?: "below-action" | "mid-page" | "above-footer" | "sidebar";
  className?: string;
}

export const EzoicAdPlaceholder = ({
  placementId,
  placement = "mid-page",
  className,
}: EzoicAdPlaceholderProps) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);

  // Check if user is premium
  useEffect(() => {
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();
        
        if (profile?.subscription_tier && profile.subscription_tier !== "free") {
          setIsPremium(true);
        }
      }
    };
    checkSubscription();
  }, []);

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    if (isPremium) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            setIsVisible(true);
            hasTriggeredRef.current = true;
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "300px",
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isPremium]);

  // Trigger Ezoic showAds when visible
  useEffect(() => {
    if (!isVisible || isPremium) return;

    // Wait a bit for the DOM to be ready, then trigger Ezoic
    const timer = setTimeout(() => {
      if (window.ezstandalone) {
        window.ezstandalone.cmd.push(() => {
          window.ezstandalone?.showAds(placementId);
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible, isPremium, placementId]);

  // Don't render for premium users
  if (isPremium) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full py-4 md:py-6 my-6 md:my-8",
        "flex flex-col items-center justify-center",
        placement === "below-action" && "mt-8",
        placement === "mid-page" && "my-10",
        placement === "above-footer" && "mt-12 mb-6",
        placement === "sidebar" && "my-4",
        className
      )}
    >
      {isVisible && (
        <div
          id={`ezoic-pub-ad-placeholder-${placementId}`}
          className="w-full flex items-center justify-center"
        />
      )}
    </div>
  );
};

export default EzoicAdPlaceholder;
