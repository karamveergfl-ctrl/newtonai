import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFeatureUsage, FEATURE_LABELS } from "@/hooks/useFeatureUsage";
import { cn } from "@/lib/utils";

const USAGE_THRESHOLD = 0.7; // 70% threshold to show banner
const STORAGE_KEY = "dismissed_upgrade_banners";

export function FloatingUpgradeBanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usage, subscription, loading } = useFeatureUsage();
  const [dismissedFeatures, setDismissedFeatures] = useState<Set<string>>(new Set());

  // Load dismissed features from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDismissedFeatures(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.error("Failed to load dismissed banners:", e);
    }
  }, []);

  // Find the feature with highest usage that's near the limit
  const nearLimitFeature = useMemo(() => {
    if (loading || subscription.tier !== "free") return null;
    
    // Only show on tool pages
    if (!location.pathname.startsWith("/tools/")) return null;

    // Find features at or above threshold that aren't dismissed
    const nearLimit = usage
      .filter(f => {
        if (f.limit === -1) return false; // Unlimited
        if (dismissedFeatures.has(f.name)) return false;
        const percent = f.used / f.limit;
        return percent >= USAGE_THRESHOLD;
      })
      .sort((a, b) => (b.used / b.limit) - (a.used / a.limit));

    return nearLimit[0] || null;
  }, [usage, subscription, loading, location.pathname, dismissedFeatures]);

  const handleDismiss = () => {
    if (!nearLimitFeature) return;
    
    const updated = new Set(dismissedFeatures);
    updated.add(nearLimitFeature.name);
    setDismissedFeatures(updated);
    
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...updated]));
    } catch (e) {
      console.error("Failed to save dismissed banners:", e);
    }
  };

  const handleUpgrade = () => {
    navigate("/pricing");
  };

  if (!nearLimitFeature) return null;

  const usagePercent = Math.min((nearLimitFeature.used / nearLimitFeature.limit) * 100, 100);
  const remaining = Math.max(nearLimitFeature.limit - nearLimitFeature.used, 0);
  const isCritical = usagePercent >= 90;
  const featureLabel = FEATURE_LABELS[nearLimitFeature.name]?.label || nearLimitFeature.name;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
      >
        <div 
          className={cn(
            "relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md",
            isCritical 
              ? "bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border-red-500/30" 
              : "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-primary/10 border-amber-500/30"
          )}
        >
          {/* Animated gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-primary/20 opacity-50" />
          
          <div className="relative p-4">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* Warning icon */}
              <div className={cn(
                "flex-shrink-0 p-2 rounded-full",
                isCritical 
                  ? "bg-red-500/20 text-red-500" 
                  : "bg-amber-500/20 text-amber-500"
              )}>
                <AlertTriangle className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">
                  {isCritical ? "Almost out of" : "Running low on"} {featureLabel}
                </h4>
                
                <div className="mt-2 space-y-1.5">
                  <Progress 
                    value={usagePercent} 
                    className={cn(
                      "h-2",
                      isCritical ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500"
                    )} 
                  />
                  <p className="text-xs text-muted-foreground">
                    {remaining} of {nearLimitFeature.limit} remaining this {nearLimitFeature.unit === "per_day" ? "day" : "month"}
                  </p>
                </div>
              </div>

              {/* Upgrade button */}
              <Button
                onClick={handleUpgrade}
                size="sm"
                className={cn(
                  "flex-shrink-0 gap-1.5 font-semibold shadow-lg",
                  isCritical 
                    ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600" 
                    : "bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary/90"
                )}
              >
                <Zap className="h-4 w-4" />
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
