import { useState, useEffect } from "react";

/**
 * Hook to detect if page height is ≥2x viewport height.
 * Used for conditional banner placement (Placement B).
 * 
 * Uses ResizeObserver for dynamic content changes.
 */
export function usePageHeight() {
  const [isLongPage, setIsLongPage] = useState(false);

  useEffect(() => {
    const checkPageHeight = () => {
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      setIsLongPage(documentHeight >= viewportHeight * 2);
    };

    // Initial check
    checkPageHeight();

    // Listen for resize events
    window.addEventListener("resize", checkPageHeight);

    // Use ResizeObserver for content changes
    const resizeObserver = new ResizeObserver(() => {
      checkPageHeight();
    });
    
    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener("resize", checkPageHeight);
      resizeObserver.disconnect();
    };
  }, []);

  return { isLongPage };
}
