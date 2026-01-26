import React, { createContext, useContext, useState, useCallback, useRef } from "react";

interface ScrollContextType {
  hasScrolled: boolean;
  scrollPosition: number;
  setScrollPosition: (position: number) => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const hasScrolled = scrollPosition > 100;

  return (
    <ScrollContext.Provider value={{ hasScrolled, scrollPosition, setScrollPosition }}>
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
