import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Extend Window interface to include Ezoic globals
declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      showAds: (...placementIds: number[]) => void;
    };
  }
}

/**
 * Hook to refresh Ezoic ads when navigating between pages in an SPA.
 * 
 * NOTE: This hook is intentionally disabled for Monetag compliance.
 * Auto-refreshing ads on route changes violates traffic quality policies.
 * 
 * Keeping the hook structure for potential future Ezoic-only use.
 */
export const useEzoicRouteRefresh = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip on initial render (ads load naturally on first page load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // DISABLED: Auto-refresh on route change violates Monetag policies
    // Ads should only load based on user-initiated actions (e.g., 50% scroll)
    // 
    // if (window.ezstandalone) {
    //   window.ezstandalone.cmd.push(() => {
    //     window.ezstandalone?.showAds();
    //   });
    // }
  }, [location.pathname]);
};

export default useEzoicRouteRefresh;