import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedCreditCounterProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

interface CreditChange {
  id: number;
  amount: number;
  type: "earn" | "spend";
}

export function AnimatedCreditCounter({ 
  value, 
  className,
  showLabel = false 
}: AnimatedCreditCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [changes, setChanges] = useState<CreditChange[]>([]);
  const prevValueRef = useRef(value);
  const changeIdRef = useRef(0);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    const diff = value - prevValue;
    
    if (diff !== 0 && prevValue !== 0) {
      // Add change indicator
      const newChange: CreditChange = {
        id: changeIdRef.current++,
        amount: Math.abs(diff),
        type: diff > 0 ? "earn" : "spend",
      };
      
      setChanges(prev => [...prev, newChange]);
      
      // Remove after animation
      setTimeout(() => {
        setChanges(prev => prev.filter(c => c.id !== newChange.id));
      }, 2000);
    }
    
    // Animate counter
    if (diff !== 0) {
      const duration = 500;
      const steps = 20;
      const stepDuration = duration / steps;
      const stepValue = diff / steps;
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.round(prevValue + (stepValue * currentStep)));
        }
      }, stepDuration);
      
      return () => clearInterval(interval);
    }
    
    prevValueRef.current = value;
  }, [value]);

  return (
    <div className={cn("relative flex items-center gap-1.5", className)}>
      <motion.div
        className="flex items-center gap-1.5"
        animate={changes.length > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Coins className="w-4 h-4 text-yellow-500" />
        <motion.span 
          className="text-sm font-semibold tabular-nums"
          key={displayValue}
        >
          {displayValue}
        </motion.span>
        {showLabel && <span className="text-xs text-muted-foreground">SC</span>}
      </motion.div>

      {/* Floating change indicators */}
      <AnimatePresence>
        {changes.map((change) => (
          <motion.div
            key={change.id}
            initial={{ opacity: 0, y: 0, x: 20 }}
            animate={{ opacity: 1, y: -20, x: 20 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={cn(
              "absolute right-0 top-0 flex items-center gap-0.5 text-xs font-bold pointer-events-none whitespace-nowrap",
              change.type === "earn" 
                ? "text-green-500" 
                : "text-red-500"
            )}
          >
            {change.type === "earn" ? (
              <>
                <TrendingUp className="w-3 h-3" />
                +{change.amount}
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                -{change.amount}
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
