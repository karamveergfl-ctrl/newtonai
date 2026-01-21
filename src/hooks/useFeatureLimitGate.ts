import { useState, useCallback } from "react";
import { useFeatureUsage, FEATURE_LABELS, FeatureLimit } from "@/hooks/useFeatureUsage";

export interface UseFeatureLimitGateReturn {
  canUse: boolean;
  tryUseFeature: () => Promise<boolean>;
  confirmUsage: (minutes?: number) => Promise<boolean>;
  feature: FeatureLimit | undefined;
  showLimitModal: boolean;
  setShowLimitModal: (show: boolean) => void;
  subscription: {
    tier: "free" | "pro" | "ultra";
    expiresAt: Date | null;
    isActive: boolean;
  };
  loading: boolean;
}

export function useFeatureLimitGate(featureName: string): UseFeatureLimitGateReturn {
  const { checkCanUse, incrementUsage, usage, subscription, loading } = useFeatureUsage();
  const [showLimitModal, setShowLimitModal] = useState(false);

  const feature = usage.find((u) => u.name === featureName);

  const tryUseFeature = useCallback(async (): Promise<boolean> => {
    // Ultra users get unlimited everything
    if (subscription.tier === "ultra") return true;

    // Pro users check if this specific feature is unlimited
    if (subscription.tier === "pro" && feature?.limit === -1) return true;

    // Check if user can still use this feature
    if (!checkCanUse(featureName)) {
      setShowLimitModal(true);
      return false;
    }

    return true;
  }, [subscription.tier, feature, checkCanUse, featureName]);

  const confirmUsage = useCallback(async (minutes?: number): Promise<boolean> => {
    // Ultra users don't need to track (but we still track for analytics)
    // Pro users with unlimited features still track
    return await incrementUsage(featureName, minutes);
  }, [incrementUsage, featureName]);

  return {
    canUse: checkCanUse(featureName),
    tryUseFeature,
    confirmUsage,
    feature,
    showLimitModal,
    setShowLimitModal,
    subscription,
    loading,
  };
}

// Helper to get display name for a feature
export function getFeatureDisplayName(featureName: string): string {
  return FEATURE_LABELS[featureName]?.label || featureName;
}

// Helper to get period text for a feature
export function getFeaturePeriodText(unit: string): string {
  if (unit === "per_day") return "today";
  if (unit === "minutes_per_month") return "this month";
  return "this month";
}
