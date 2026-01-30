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
 * Calling ezstandalone.showAds() with no arguments will automatically
 * refresh all existing placeholders on the new page.
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

    // On route change, trigger Ezoic to refresh all ad placements
    if (window.ezstandalone) {
      window.ezstandalone.cmd.push(() => {
        window.ezstandalone?.showAds();
      });
    }
  }, [location.pathname]);
};

export default useEzoicRouteRefresh;
