import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/hooks/useInstitution";
import type { InstitutionTier } from "@/lib/institutionTierConfig";
import { TIER_CONFIGS } from "@/lib/institutionTierConfig";

export interface BillingStats {
  plan_tier: InstitutionTier;
  student_seats: number;
  teacher_seats: number;
  price_per_student: number;
  price_per_teacher: number;
  billing_cycle: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  active_students: number;
  active_teachers: number;
  student_utilization: number;
  teacher_utilization: number;
  total_paid: number;
  last_payment_date: string | null;
}

export function useInstitutionSubscription() {
  const { institution, loading: instLoading } = useInstitution();

  const { data: billingStats, isLoading: statsLoading } = useQuery({
    queryKey: ["institution-billing-stats", institution?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_institution_billing_stats", {
        p_institution_id: institution!.id,
      });
      if (error) throw error;
      return data as unknown as BillingStats;
    },
    enabled: !!institution?.id,
    staleTime: 2 * 60 * 1000,
  });

  const tier: InstitutionTier = billingStats?.plan_tier ?? "starter";
  const tierConfig = TIER_CONFIGS[tier];

  return {
    billingStats,
    tier,
    tierConfig,
    loading: instLoading || statsLoading,
    institutionId: institution?.id ?? null,
  };
}
