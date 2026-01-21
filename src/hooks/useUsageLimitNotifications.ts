import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFeatureUsage, FEATURE_LABELS } from "@/hooks/useFeatureUsage";

const NOTIFICATION_THRESHOLD = 80; // Show notification at 80% usage
const CRITICAL_THRESHOLD = 95; // Show critical notification at 95%

export function useUsageLimitNotifications() {
  const { usage, subscription, loading } = useFeatureUsage();
  const { toast } = useToast();
  const notifiedFeatures = useRef<Set<string>>(new Set());
  const criticalNotifiedFeatures = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (loading || subscription.tier === "ultra") return;

    // Check each feature for approaching limits
    usage.forEach((feature) => {
      if (feature.limit === -1) return; // Skip unlimited features

      const percentage = (feature.used / feature.limit) * 100;
      const featureKey = `${feature.name}-${feature.unit}`;

      // Critical notification (95%+)
      if (percentage >= CRITICAL_THRESHOLD && !criticalNotifiedFeatures.current.has(featureKey)) {
        criticalNotifiedFeatures.current.add(featureKey);
        const remaining = feature.limit - feature.used;
        const periodText = feature.unit === "per_day" ? "today" : "this month";

        toast({
          title: `⚠️ ${feature.label} Almost Used Up!`,
          description: `Only ${remaining} ${feature.unit === "minutes_per_month" ? "minutes" : "use(s)"} remaining ${periodText}. Upgrade for more.`,
          variant: "destructive",
          duration: 8000,
        });
      }
      // Warning notification (80%+)
      else if (percentage >= NOTIFICATION_THRESHOLD && percentage < CRITICAL_THRESHOLD && !notifiedFeatures.current.has(featureKey)) {
        notifiedFeatures.current.add(featureKey);
        const remaining = feature.limit - feature.used;
        const periodText = feature.unit === "per_day" ? "today" : "this month";

        toast({
          title: `${feature.icon} ${feature.label} Usage Alert`,
          description: `You've used ${Math.round(percentage)}% of your limit. ${remaining} remaining ${periodText}.`,
          duration: 6000,
        });
      }
    });
  }, [usage, subscription, loading, toast]);

  // Reset notifications at the start of new periods
  useEffect(() => {
    const resetDaily = () => {
      // Clear daily feature notifications
      const dailyFeatures = usage.filter(f => f.unit === "per_day").map(f => `${f.name}-${f.unit}`);
      dailyFeatures.forEach(key => {
        notifiedFeatures.current.delete(key);
        criticalNotifiedFeatures.current.delete(key);
      });
    };

    // Check if we need to reset (simplified - in production would use actual period tracking)
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    
    const timeout = setTimeout(resetDaily, msUntilMidnight);
    return () => clearTimeout(timeout);
  }, [usage]);

  return null;
}
