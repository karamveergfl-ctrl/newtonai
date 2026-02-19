import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useGuestUsage } from "@/hooks/useGuestUsage";
import { supabase } from "@/integrations/supabase/client";

interface GuestTrialContextValue {
  guestUsageCount: number;
  maxUses: number;
  guestLimitReached: boolean;
  incrementGuestUsage: () => void;
  isAuthenticated: boolean;
  showTrialPrompt: boolean;
  setShowTrialPrompt: (show: boolean) => void;
}

const GuestTrialContext = createContext<GuestTrialContextValue | null>(null);

export function GuestTrialProvider({ children }: { children: ReactNode }) {
  const {
    guestUsageCount,
    guestLimitReached,
    maxUses,
    incrementGuestUsage,
    clearGuestData,
  } = useGuestUsage();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes - clear guest data on signup/login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const wasAuthenticated = isAuthenticated;
      setIsAuthenticated(!!session);

      // User just signed in — clear guest trial data
      if (session && !wasAuthenticated) {
        clearGuestData();
        setShowTrialPrompt(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GuestTrialContext.Provider
      value={{
        guestUsageCount,
        maxUses,
        guestLimitReached,
        incrementGuestUsage,
        isAuthenticated,
        showTrialPrompt,
        setShowTrialPrompt,
      }}
    >
      {children}
    </GuestTrialContext.Provider>
  );
}

export function useGuestTrial() {
  const ctx = useContext(GuestTrialContext);
  if (!ctx) throw new Error("useGuestTrial must be used within GuestTrialProvider");
  return ctx;
}
