import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  pullProgress: number;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  pullProgress,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const isReady = pullProgress >= 1;
  
  return (
    <AnimatePresence>
      {(pullDistance > 10 || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: 1, 
            height: isRefreshing ? 50 : Math.min(pullDistance, 60),
          }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center overflow-hidden"
        >
          <motion.div
            className={cn(
              "flex items-center gap-2 text-sm",
              isReady || isRefreshing ? "text-primary" : "text-muted-foreground"
            )}
            animate={{
              scale: isReady ? 1.1 : 1,
            }}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : isReady ? (
              <>
                <motion.div
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowDown className="w-4 h-4" />
                </motion.div>
                <span>Release to refresh</span>
              </>
            ) : (
              <>
                <motion.div
                  style={{ 
                    rotate: pullProgress * 180,
                    opacity: 0.5 + pullProgress * 0.5,
                  }}
                >
                  <ArrowDown className="w-4 h-4" />
                </motion.div>
                <span>Pull to refresh</span>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
