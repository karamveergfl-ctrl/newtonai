import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SbInstitution {
  id: string;
  name: string;
  type: string;
  city: string | null;
  state: string | null;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  plan: string;
  max_smartboards: number;
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
}

export interface SbBoard {
  id: string;
  institution_id: string;
  board_name: string;
  grade_level: string | null;
  subject_focus: string | null;
  activation_code: string;
  activated_at: string | null;
  is_active: boolean;
  last_active_at: string | null;
  created_at: string;
}

export interface SbUsage {
  id: string;
  board_id: string;
  search_query: string;
  video_id: string | null;
  video_title: string | null;
  video_channel: string | null;
  action: string;
  session_date: string;
  created_at: string;
}

/** Loads the signed-in user's SmartBoard school, its boards and usage log. */
export function useSmartboardAdmin() {
  const [institution, setInstitution] = useState<SbInstitution | null>(null);
  const [boards, setBoards] = useState<SbBoard[]>([]);
  const [usage, setUsage] = useState<SbUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [noAccess, setNoAccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setLoading(false);
      setNoAccess(true);
      return;
    }

    const { data: membership } = await supabase
      .from("sb_institution_admins")
      .select("institution_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!membership) {
      setNoAccess(true);
      setLoading(false);
      return;
    }

    const [instRes, boardsRes, usageRes] = await Promise.all([
      supabase.from("sb_institutions").select("*").eq("id", membership.institution_id).maybeSingle(),
      supabase.from("sb_boards").select("*").eq("institution_id", membership.institution_id).order("created_at", { ascending: true }),
      supabase
        .from("sb_board_usage")
        .select("*")
        .eq("institution_id", membership.institution_id)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    setInstitution((instRes.data as SbInstitution) ?? null);
    setBoards((boardsRes.data as SbBoard[]) ?? []);
    setUsage((usageRes.data as SbUsage[]) ?? []);
    setNoAccess(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { institution, boards, usage, loading, noAccess, refresh: load };
}