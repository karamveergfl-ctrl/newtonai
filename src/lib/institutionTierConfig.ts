export type InstitutionTier = "starter" | "growth" | "enterprise";

export type InstitutionFeature =
  | "live_sessions"
  | "ai_insights"
  | "result_processing"
  | "faculty_monitoring"
  | "compliance_audit"
  | "report_card_pdfs";

export interface TierConfig {
  label: string;
  description: string;
  limits: Record<InstitutionFeature, number | boolean | string>;
  maxStudentSeats: number;
  maxTeacherSeats: number;
  pricePerStudent: number; // INR per month
  pricePerTeacher: number; // INR per month
}

export const TIER_CONFIGS: Record<InstitutionTier, TierConfig> = {
  starter: {
    label: "Starter",
    description: "Basic classroom tools for small institutions",
    limits: {
      live_sessions: 20,
      ai_insights: false,
      result_processing: "basic",
      faculty_monitoring: false,
      compliance_audit: "none",
      report_card_pdfs: 50,
    },
    maxStudentSeats: 50,
    maxTeacherSeats: 5,
    pricePerStudent: 49,
    pricePerTeacher: 499,
  },
  growth: {
    label: "Growth",
    description: "Full-featured platform for growing institutions",
    limits: {
      live_sessions: 100,
      ai_insights: true,
      result_processing: "full",
      faculty_monitoring: true,
      compliance_audit: "basic",
      report_card_pdfs: 500,
    },
    maxStudentSeats: 500,
    maxTeacherSeats: 50,
    pricePerStudent: 99,
    pricePerTeacher: 999,
  },
  enterprise: {
    label: "Enterprise",
    description: "Unlimited access with priority support",
    limits: {
      live_sessions: -1, // unlimited
      ai_insights: true,
      result_processing: "full",
      faculty_monitoring: true,
      compliance_audit: "full",
      report_card_pdfs: -1,
    },
    maxStudentSeats: -1,
    maxTeacherSeats: -1,
    pricePerStudent: 149,
    pricePerTeacher: 1499,
  },
};

export function canUseFeature(
  tier: InstitutionTier,
  feature: InstitutionFeature
): boolean {
  const limit = TIER_CONFIGS[tier].limits[feature];
  if (typeof limit === "boolean") return limit;
  if (typeof limit === "string") return limit !== "none";
  if (typeof limit === "number") return limit !== 0;
  return false;
}

export function getMinTierForFeature(feature: InstitutionFeature): InstitutionTier {
  if (canUseFeature("starter", feature)) return "starter";
  if (canUseFeature("growth", feature)) return "growth";
  return "enterprise";
}

export function getYearlyDiscount(): number {
  return 0.2; // 20% off
}
