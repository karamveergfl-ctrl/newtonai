import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Institution {
  id: string;
  name: string;
  type: string;
  admin_user_id: string;
  logo_url: string | null;
  timezone: string;
  created_at: string;
}

interface InstitutionMembership {
  institution: Institution;
  role: string;
}

export function useInstitution() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ["user-institution"],
    queryFn: async (): Promise<InstitutionMembership | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: membership } = await supabase
        .from("institution_members")
        .select("role, institutions(*)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!membership?.institutions) return null;

      return {
        institution: membership.institutions as unknown as Institution,
        role: membership.role,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    institution: data?.institution ?? null,
    institutionRole: data?.role ?? null,
    loading,
  };
}
