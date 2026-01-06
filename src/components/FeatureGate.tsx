import { useState, useEffect, ReactNode } from "react";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { UsageLimitModal } from "@/components/UsageLimitModal";

interface FeatureGateProps {
  featureName: string;
  children: ReactNode;
  onBlocked?: () => void;
}

export function FeatureGate({ featureName, children, onBlocked }: FeatureGateProps) {
  const { checkCanUse, usage, subscription } = useFeatureUsage();
  const [showModal, setShowModal] = useState(false);

  const feature = usage.find((u) => u.name === featureName);
  const canUse = checkCanUse(featureName);

  if (!canUse && subscription.tier === "free") {
    return (
      <>
        <div 
          onClick={() => {
            setShowModal(true);
            onBlocked?.();
          }}
          className="cursor-pointer"
        >
          {children}
        </div>
        <UsageLimitModal
          open={showModal}
          onClose={() => setShowModal(false)}
          featureName={feature?.label || featureName}
          currentUsage={feature?.used || 0}
          limit={feature?.limit || 0}
        />
      </>
    );
  }

  return <>{children}</>;
}

export function useFeatureGate(featureName: string) {
  const { checkCanUse, incrementUsage, usage, subscription, refreshUsage } = useFeatureUsage();
  const [showModal, setShowModal] = useState(false);

  const feature = usage.find((u) => u.name === featureName);
  const canUse = checkCanUse(featureName);

  const tryUseFeature = async (): Promise<boolean> => {
    if (!canUse && subscription.tier === "free") {
      setShowModal(true);
      return false;
    }
    
    await incrementUsage(featureName);
    return true;
  };

  const modal = (
    <UsageLimitModal
      open={showModal}
      onClose={() => setShowModal(false)}
      featureName={feature?.label || featureName}
      currentUsage={feature?.used || 0}
      limit={feature?.limit || 0}
    />
  );

  return {
    canUse,
    tryUseFeature,
    modal,
    usage: feature,
    refreshUsage,
  };
}
