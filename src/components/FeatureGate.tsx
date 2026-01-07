import { useState, ReactNode } from "react";
import { useCredits } from "@/hooks/useCredits";
import { CreditModal } from "@/components/CreditModal";
import { FEATURE_NAMES } from "@/lib/creditConfig";
import { toast } from "sonner";

interface FeatureGateProps {
  featureName: string;
  children: ReactNode;
  onBlocked?: () => void;
}

export function FeatureGate({ featureName, children, onBlocked }: FeatureGateProps) {
  const { hasEnoughCredits, isPremium, getFeatureCost, credits, earnCredits, canWatchMoreAds, getRemainingAds } = useCredits();
  const [showModal, setShowModal] = useState(false);

  const canUse = isPremium || hasEnoughCredits(featureName);
  const cost = getFeatureCost(featureName);

  if (!canUse) {
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
        <CreditModal
          open={showModal}
          onOpenChange={setShowModal}
          featureName={FEATURE_NAMES[featureName] || featureName}
          requiredCredits={cost}
          currentCredits={credits}
          onWatchAd={earnCredits}
          canWatchMoreAds={canWatchMoreAds()}
          remainingAds={getRemainingAds()}
        />
      </>
    );
  }

  return <>{children}</>;
}

export function useFeatureGate(featureName: string) {
  const { hasEnoughCredits, spendCredits, isPremium, getFeatureCost, credits, loading, earnCredits, canWatchMoreAds, getRemainingAds } = useCredits();
  const [showModal, setShowModal] = useState(false);

  const cost = getFeatureCost(featureName);
  const canUse = isPremium || hasEnoughCredits(featureName);

  const tryUseFeature = async (): Promise<boolean> => {
    // Premium users bypass credit system
    if (isPremium) return true;
    
    // Check if enough credits
    if (!hasEnoughCredits(featureName)) {
      setShowModal(true);
      return false;
    }
    
    // Deduct credits
    const success = await spendCredits(featureName);
    if (!success) {
      setShowModal(true);
      return false;
    }
    
    // Show notification of credit spent
    const featureDisplayName = FEATURE_NAMES[featureName] || featureName;
    toast.info(`-${cost} credits used for ${featureDisplayName}`, {
      duration: 3000,
    });
    
    return true;
  };

  const modal = (
    <CreditModal
      open={showModal}
      onOpenChange={setShowModal}
      featureName={FEATURE_NAMES[featureName] || featureName}
      requiredCredits={cost}
      currentCredits={credits}
      onWatchAd={earnCredits}
      canWatchMoreAds={canWatchMoreAds()}
      remainingAds={getRemainingAds()}
    />
  );

  return {
    canUse,
    tryUseFeature,
    modal,
    credits,
    cost,
    loading,
    isPremium,
  };
}
