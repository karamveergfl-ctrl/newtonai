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
  return <Icon className="w-8 h-8" />;
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

  const handleSkip = () => {
    handleClose();
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

    const cardWidth = 400;
    const cardHeight = 280;
    const padding = 20;
    const arrowOffset = 60;

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
    if (!targetPosition) return { display: "none" };

    const arrowSize = 32;

    switch (step.arrowDirection) {
      case "up":
        return {
          top: `${targetPosition.top + targetPosition.height + 8}px`,
          left: `${targetPosition.left + targetPosition.width / 2 - arrowSize / 2}px`,
        };
      case "down":
        return {
          top: `${targetPosition.top - arrowSize - 8}px`,
          left: `${targetPosition.left + targetPosition.width / 2 - arrowSize / 2}px`,
        };
      case "left":
        return {
          top: `${targetPosition.top + targetPosition.height / 2 - arrowSize / 2}px`,
          left: `${targetPosition.left + targetPosition.width + 8}px`,
        };
      case "right":
        return {
          top: `${targetPosition.top + targetPosition.height / 2 - arrowSize / 2}px`,
          left: `${targetPosition.left - arrowSize - 8}px`,
        };
      default:
        return { display: "none" };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={handleSkip}
          >
            {/* Dark overlay with spotlight hole */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Spotlight highlight on target element */}
            {targetPosition && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="absolute rounded-xl ring-4 ring-primary ring-offset-4 ring-offset-transparent"
                style={{
                  top: targetPosition.top - 8,
                  left: targetPosition.left - 8,
                  width: targetPosition.width + 16,
                  height: targetPosition.height + 16,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.6), 0 0 40px 8px hsl(var(--primary) / 0.3)",
                }}
              />
            )}
          </motion.div>

          {/* Animated Arrow */}
          {targetPosition && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: 1, 
                y: [0, 8, 0],
              }}
              transition={{
                y: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="fixed z-50 text-primary drop-shadow-lg"
              style={getArrowStyle()}
            >
              <div className="relative">
                <ArrowIcon direction={step.arrowDirection} />
                <div className="absolute inset-0 animate-ping opacity-50">
                  <ArrowIcon direction={step.arrowDirection} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Tutorial Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 w-[90vw] max-w-md"
            style={getCardStyle()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-primary/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Quick Tutorial</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {currentStep + 1} of {tutorialSteps.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {tutorialSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/30 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1"
                >
                  {currentStep < tutorialSteps.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
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
