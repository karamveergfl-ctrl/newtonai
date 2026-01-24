import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingScrollTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling down 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 transition-all duration-300 group"
            aria-label="Scroll to top"
          >
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
            </motion.div>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
