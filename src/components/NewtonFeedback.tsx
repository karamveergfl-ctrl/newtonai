import { motion, AnimatePresence } from "framer-motion";
import { LottieNewton, NewtonState } from "@/components/newton/LottieNewton";

type FeedbackState = "confused" | "celebrating" | "sleeping";

interface NewtonFeedbackProps {
  state: FeedbackState | null;
  message?: string;
  subMessage?: string;
  onDismiss?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "overlay" | "inline" | "toast";
  autoDismissMs?: number;
}

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
};

const defaultMessages: Record<FeedbackState, { message: string; subMessage?: string }> = {
  confused: {
    message: "Oops, something went wrong!",
    subMessage: "Let me try that again...",
  },
  celebrating: {
    message: "Amazing work!",
    subMessage: "You're doing great!",
  },
  sleeping: {
    message: "Taking a break?",
    subMessage: "Click anywhere to continue studying",
  },
};

export function NewtonFeedback({
  state,
  message,
  subMessage,
  onDismiss,
  size = "md",
  variant = "overlay",
  autoDismissMs,
}: NewtonFeedbackProps) {
  const displayMessage = message ?? (state ? defaultMessages[state].message : "");
  const displaySubMessage = subMessage ?? (state ? defaultMessages[state].subMessage : "");

  // Auto-dismiss after specified time
  const handleAnimationComplete = () => {
    if (autoDismissMs && onDismiss) {
      setTimeout(onDismiss, autoDismissMs);
    }
  };

  if (variant === "overlay") {
    return (
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={onDismiss}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="flex flex-col items-center gap-4 p-8 bg-card/95 rounded-2xl border border-border/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={sizeClasses[size]}>
                <LottieNewton 
                  state={state as NewtonState} 
                  className="w-full h-full"
                />
              </div>
              <div className="text-center">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg font-semibold text-foreground"
                >
                  {displayMessage}
                </motion.p>
                {displaySubMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-muted-foreground mt-1"
                  >
                    {displaySubMessage}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === "toast") {
    return (
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0, x: 50, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            onAnimationComplete={handleAnimationComplete}
            className="fixed bottom-4 right-4 z-[100] flex items-center gap-3 p-4 bg-card/95 rounded-xl border border-border/50 shadow-xl cursor-pointer"
            onClick={onDismiss}
          >
            <div className={sizeClasses.sm}>
              <LottieNewton 
                state={state as NewtonState} 
                className="w-full h-full"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{displayMessage}</p>
              {displaySubMessage && (
                <p className="text-xs text-muted-foreground">{displaySubMessage}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Inline variant
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex flex-col items-center gap-3 p-6"
        >
          <div className={sizeClasses[size]}>
            <LottieNewton 
              state={state as NewtonState} 
              className="w-full h-full"
            />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">{displayMessage}</p>
            {displaySubMessage && (
              <p className="text-sm text-muted-foreground mt-1">{displaySubMessage}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
