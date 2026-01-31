import React, { createContext, useContext, useState, useCallback } from "react";

interface ScrollContextType {
  hasScrolled: boolean;
  scrollPosition: number;
  scrollPercent: number;
  setScrollPosition: (position: number, scrollHeight: number, clientHeight: number) => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [scrollPosition, setScrollPositionState] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const hasScrolled = scrollPosition > 100;

  const setScrollPosition = useCallback((position: number, scrollHeight: number, clientHeight: number) => {
    setScrollPositionState(position);
    // Calculate scroll percentage (how far user has scrolled through scrollable content)
    const maxScroll = scrollHeight - clientHeight;
    const percent = maxScroll > 0 ? (position / maxScroll) * 100 : 0;
    setScrollPercent(Math.min(100, Math.max(0, percent)));
  }, []);

  return (
    <ScrollContext.Provider value={{ hasScrolled, scrollPosition, scrollPercent, setScrollPosition }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollContext() {
  const context = useContext(ScrollContext);
  if (context === undefined) {
    throw new Error("useScrollContext must be used within a ScrollProvider");
  }
  return context;
}
