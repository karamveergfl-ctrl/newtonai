import { useInstitutionSubscription } from "./useInstitutionSubscription";
import { canUseFeature, getMinTierForFeature, TIER_CONFIGS } from "@/lib/institutionTierConfig";
import type { InstitutionFeature, InstitutionTier } from "@/lib/institutionTierConfig";

export function useInstitutionFeatureGate(feature: InstitutionFeature) {
  const { tier, loading } = useInstitutionSubscription();

  const allowed = canUseFeature(tier, feature);
  const requiredTier: InstitutionTier = getMinTierForFeature(feature);
  const requiredTierLabel = TIER_CONFIGS[requiredTier].label;

  return {
    canUse: allowed,
    loading,
    currentTier: tier,
    requiredTier,
    requiredTierLabel,
  };
}
