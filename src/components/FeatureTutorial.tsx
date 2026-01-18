import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, Search, Camera, Sparkles, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;
  arrowDirection: "up" | "down" | "left" | "right";
  cardPosition: "top" | "bottom" | "left" | "right" | "center";
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Topic-Based Video Search",
    description: "Select any text in your document to instantly find relevant YouTube tutorials and explanations on that topic.",
    icon: <Search className="w-5 h-5" />,
    targetSelector: "[data-tutorial='search-box']",
    arrowDirection: "up",
    cardPosition: "bottom",
  },
  {
    title: "Screenshot to Solve",
    description: "Use the screenshot tool to capture any numerical problem. Our AI will provide step-by-step solutions instantly.",
    icon: <Camera className="w-5 h-5" />,
    targetSelector: "[data-tutorial='upload-zone']",
    arrowDirection: "up",
    cardPosition: "bottom",
  },
  {
    title: "AI-Powered Study Tools",
    description: "Generate flashcards, quizzes, summaries, and mind maps from your documents with one click.",
    icon: <Sparkles className="w-5 h-5" />,
    targetSelector: "[data-tutorial='upload-zone']",
    arrowDirection: "up",
    cardPosition: "bottom",
  },
];

const TUTORIAL_STORAGE_KEY = "newton-ai-tutorial-seen";

interface TargetPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

const ArrowIcon = ({ direction }: { direction: "up" | "down" | "left" | "right" }) => {
  const icons = {
    up: ArrowUp,
    down: ArrowDown,
    left: ArrowLeft,
    right: ArrowRight,
  };
  const Icon = icons[direction];
  return <Icon className="w-6 h-6" />;
};

export function FeatureTutorial() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState<TargetPosition | null>(null);

  const updateTargetPosition = useCallback(() => {
    const step = tutorialSteps[currentStep];
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetPosition(null);
      }
    } else {
      setTargetPosition(null);
    }
  }, [currentStep]);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateTargetPosition();
      window.addEventListener("resize", updateTargetPosition);
      window.addEventListener("scroll", updateTargetPosition);
      return () => {
        window.removeEventListener("resize", updateTargetPosition);
        window.removeEventListener("scroll", updateTargetPosition);
      };
    }
  }, [isVisible, currentStep, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, currentStep]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  const step = tutorialSteps[currentStep];

  // Calculate card position based on target element
  const getCardStyle = () => {
    if (!targetPosition) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const cardWidth = 380;
    const cardHeight = 260;
    const padding = 24;
    const arrowOffset = 48;

    switch (step.cardPosition) {
      case "bottom":
        return {
          top: `${targetPosition.top + targetPosition.height + arrowOffset}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - cardWidth - padding, targetPosition.left + targetPosition.width / 2 - cardWidth / 2))}px`,
          transform: "none",
        };
      case "top":
        return {
          top: `${targetPosition.top - cardHeight - arrowOffset}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - cardWidth - padding, targetPosition.left + targetPosition.width / 2 - cardWidth / 2))}px`,
          transform: "none",
        };
      case "left":
        return {
          top: `${targetPosition.top + targetPosition.height / 2 - cardHeight / 2}px`,
          left: `${targetPosition.left - cardWidth - arrowOffset}px`,
          transform: "none",
        };
      case "right":
        return {
          top: `${targetPosition.top + targetPosition.height / 2 - cardHeight / 2}px`,
          left: `${targetPosition.left + targetPosition.width + arrowOffset}px`,
          transform: "none",
        };
      default:
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  // Calculate arrow position
  const getArrowStyle = () => {
    if (!targetPosition) return { display: "none" as const };

    const arrowSize = 24;

    switch (step.arrowDirection) {
      case "up":
        return {
          top: `${targetPosition.top + targetPosition.height + 12}px`,
          left: `${targetPosition.left + targetPosition.width / 2 - arrowSize / 2}px`,
        };
      case "down":
        return {
          top: `${targetPosition.top - arrowSize - 12}px`,
          left: `${targetPosition.left + targetPosition.width / 2 - arrowSize / 2}px`,
        };
      case "left":
        return {
          top: `${targetPosition.top + targetPosition.height / 2 - arrowSize / 2}px`,
          left: `${targetPosition.left + targetPosition.width + 12}px`,
        };
      case "right":
        return {
          top: `${targetPosition.top + targetPosition.height / 2 - arrowSize / 2}px`,
          left: `${targetPosition.left - arrowSize - 12}px`,
        };
      default:
        return { display: "none" as const };
    }
  };

  const spotlightPadding = 12;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* SVG Mask Overlay - True spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-auto"
            onClick={handleClose}
          >
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {targetPosition && (
                    <rect
                      x={targetPosition.left - spotlightPadding}
                      y={targetPosition.top - spotlightPadding}
                      width={targetPosition.width + spotlightPadding * 2}
                      height={targetPosition.height + spotlightPadding * 2}
                      rx="16"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.75)"
                mask="url(#spotlight-mask)"
              />
            </svg>
          </motion.div>

          {/* Glowing ring around target */}
          {targetPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: [
                  "0 0 0 2px hsl(var(--primary) / 0.6), 0 0 20px 0 hsl(var(--primary) / 0.3)",
                  "0 0 0 2px hsl(var(--primary) / 0.8), 0 0 30px 4px hsl(var(--primary) / 0.5)",
                  "0 0 0 2px hsl(var(--primary) / 0.6), 0 0 20px 0 hsl(var(--primary) / 0.3)"
                ]
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              }}
              className="fixed z-50 rounded-2xl pointer-events-none"
              style={{
                top: targetPosition.top - spotlightPadding,
                left: targetPosition.left - spotlightPadding,
                width: targetPosition.width + spotlightPadding * 2,
                height: targetPosition.height + spotlightPadding * 2,
              }}
            />
          )}

          {/* Animated Arrow */}
          {targetPosition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.7, 1, 0.7],
                y: step.arrowDirection === "up" ? [0, 6, 0] : step.arrowDirection === "down" ? [0, -6, 0] : 0,
                x: step.arrowDirection === "left" ? [0, 6, 0] : step.arrowDirection === "right" ? [0, -6, 0] : 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="fixed z-50 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              style={getArrowStyle()}
            >
              <ArrowIcon direction={step.arrowDirection} />
            </motion.div>
          )}

          {/* Tutorial Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 w-[90vw] max-w-[380px]"
            style={getCardStyle()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-card via-card to-card/95 border border-border/50 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent px-5 py-3 flex items-center justify-between border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Quick Tutorial</span>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {currentStep + 1}/{tutorialSteps.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1.5">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5 mt-5">
                  {tutorialSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/25 w-1.5 hover:bg-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-muted/20 border-t border-border/30 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground text-xs h-8"
                >
                  Skip tutorial
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1 h-8 text-xs"
                >
                  {currentStep < tutorialSteps.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
