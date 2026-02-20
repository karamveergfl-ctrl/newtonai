import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const StickyCTABar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Find the hero section and footer CTA section
    const heroSection = document.getElementById("hero-section");
    const ctaSection = document.getElementById("footer-cta-section");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "hero-section") {
            // Show bar when hero is NOT visible (scrolled past)
            if (!entry.isIntersecting) {
              setIsVisible(true);
            } else {
              setIsVisible(false);
            }
          }
          if (entry.target.id === "footer-cta-section") {
            // Hide bar when footer CTA is visible
            if (entry.isIntersecting) {
              setIsVisible(false);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroSection) observer.observe(heroSection);
    if (ctaSection) observer.observe(ctaSection);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-sm border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Button asChild size="lg" className="w-full group">
        <Link to="/auth">
          Get Started Free
          <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
};

export default StickyCTABar;
