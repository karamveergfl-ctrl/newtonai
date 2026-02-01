import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BannerAdResponse {
  provider: "adsterra" | "monetag" | null;
  ad_html: string | null;
}

interface BannerAdContextType {
  placementALoaded: boolean;
  setPlacementALoaded: (loaded: boolean) => void;
  cachedAdResponse: BannerAdResponse | null;
  loadBannerAd: () => Promise<BannerAdResponse>;
  resetAdState: () => void;
}

const BannerAdContext = createContext<BannerAdContextType>({
  placementALoaded: false,
  setPlacementALoaded: () => {},
  cachedAdResponse: null,
  loadBannerAd: async () => ({ provider: null, ad_html: null }),
  resetAdState: () => {},
});

export function BannerAdProvider({ children }: { children: ReactNode }) {
  const [placementALoaded, setPlacementALoaded] = useState(false);
  const [cachedAdResponse, setCachedAdResponse] = useState<BannerAdResponse | null>(null);
  const loadingRef = useRef(false);

  const loadBannerAd = useCallback(async (): Promise<BannerAdResponse> => {
    // Return cached response if available
    if (cachedAdResponse) {
      return cachedAdResponse;
    }

    // Prevent concurrent requests
    if (loadingRef.current) {
      // Wait for the ongoing request
      await new Promise(resolve => setTimeout(resolve, 100));
      if (cachedAdResponse) return cachedAdResponse;
    }

    loadingRef.current = true;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-banner-ad`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch banner ad");
      }

      const data: BannerAdResponse = await response.json();
      setCachedAdResponse(data);
      return data;
    } catch (error) {
      console.error("Error loading banner ad:", error);
      const fallback: BannerAdResponse = { provider: null, ad_html: null };
      setCachedAdResponse(fallback);
      return fallback;
    } finally {
      loadingRef.current = false;
    }
  }, [cachedAdResponse]);

  const resetAdState = useCallback(() => {
    setPlacementALoaded(false);
    setCachedAdResponse(null);
  }, []);

  return (
    <BannerAdContext.Provider
      value={{
        placementALoaded,
        setPlacementALoaded,
        cachedAdResponse,
        loadBannerAd,
        resetAdState,
      }}
    >
      {children}
    </BannerAdContext.Provider>
  );
}

export function useBannerAd() {
  return useContext(BannerAdContext);
}
