import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SpotlightSyncStats } from "@/types/liveSession";

interface UseSpotlightSyncProps {
  sessionId: string;
  role: "teacher" | "student";
}

interface UseSpotlightSyncReturn {
  isSynced: boolean;
  spotlightViewActive: boolean;
  lastViewedSlideIndex: number;
  spotlightEnabled: boolean;
  teacherSlideIndex: number;
  teacherSlideContent: string;
  teacherSlideTitle: string;
  syncStats: SpotlightSyncStats | null;
  unlockScroll: () => Promise<void>;
  resyncToTeacher: () => Promise<void>;
  toggleSpotlightView: (active: boolean) => Promise<void>;
  updateSlideContent: (slideIndex: number, content: string, title: string) => Promise<void>;
  toggleSpotlight: (enabled: boolean) => Promise<void>;
  fetchSyncStats: () => Promise<void>;
}

export function useSpotlightSync({ sessionId, role }: UseSpotlightSyncProps): UseSpotlightSyncReturn {
  const [isSynced, setIsSynced] = useState(true);
  const [spotlightViewActive, setSpotlightViewActive] = useState(true);
  const [lastViewedSlideIndex, setLastViewedSlideIndex] = useState(0);
  const [spotlightEnabled, setSpotlightEnabled] = useState(true);
  const [teacherSlideIndex, setTeacherSlideIndex] = useState(0);
  const [teacherSlideContent, setTeacherSlideContent] = useState("");
  const [teacherSlideTitle, setTeacherSlideTitle] = useState("");
  const [syncStats, setSyncStats] = useState<SpotlightSyncStats | null>(null);
  const mountedRef = useRef(true);

  // Load initial state
  useEffect(() => {
    const loadInitial = async () => {
      try {
        // Fetch session slide index
        const { data: session } = await supabase
          .from("live_sessions")
          .select("current_slide_index")
          .eq("id", sessionId)
          .single();
        if (session && mountedRef.current) {
          setTeacherSlideIndex(session.current_slide_index ?? 0);
          setLastViewedSlideIndex(session.current_slide_index ?? 0);
        }

        // Fetch spotlight session state via raw query (table not in generated types)
        const { data: spotState } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> } } } }).from("spotlight_session_state").select("*").eq("session_id", sessionId).maybeSingle();
        if (spotState && mountedRef.current) {
          setSpotlightEnabled(spotState.spotlight_enabled as boolean ?? true);
          setTeacherSlideContent(spotState.current_slide_content as string ?? "");
          setTeacherSlideTitle(spotState.current_slide_title as string ?? "");
        }

        // For students, load their own state
        if (role === "student") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: studentState } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> } } } } }).from("student_spotlight_state").select("*").eq("session_id", sessionId).eq("student_id", user.id).maybeSingle();
            if (studentState && mountedRef.current) {
              setIsSynced(studentState.is_synced as boolean ?? true);
              setLastViewedSlideIndex(studentState.last_viewed_slide_index as number ?? 0);
              setSpotlightViewActive(studentState.spotlight_view_active as boolean ?? true);
            }
          }
        }
      } catch (err) {
        console.error("useSpotlightSync init error:", err);
      }
    };
    loadInitial();
  }, [sessionId, role]);

  // Student: upsert helper
  const upsertStudentState = useCallback(
    async (updates: { is_synced: boolean; last_viewed_slide_index: number; spotlight_view_active: boolean }) => {
      try {
        await supabase.rpc("upsert_student_spotlight_state", {
          p_session_id: sessionId,
          p_is_synced: updates.is_synced,
          p_last_viewed_slide_index: updates.last_viewed_slide_index,
          p_spotlight_view_active: updates.spotlight_view_active,
        });
      } catch (err) {
        console.error("upsertStudentState error:", err);
      }
    },
    [sessionId]
  );

  const unlockScroll = useCallback(async () => {
    if (role !== "student") return;
    setIsSynced(false);
    await upsertStudentState({
      is_synced: false,
      last_viewed_slide_index: lastViewedSlideIndex,
      spotlight_view_active: spotlightViewActive,
    });
  }, [role, upsertStudentState, lastViewedSlideIndex, spotlightViewActive]);

  const resyncToTeacher = useCallback(async () => {
    if (role !== "student") return;
    setIsSynced(true);
    setLastViewedSlideIndex(teacherSlideIndex);
    await upsertStudentState({
      is_synced: true,
      last_viewed_slide_index: teacherSlideIndex,
      spotlight_view_active: spotlightViewActive,
    });
  }, [role, teacherSlideIndex, upsertStudentState, spotlightViewActive]);

  const toggleSpotlightView = useCallback(
    async (active: boolean) => {
      if (role !== "student") return;
      setSpotlightViewActive(active);
      await upsertStudentState({
        is_synced: isSynced,
        last_viewed_slide_index: lastViewedSlideIndex,
        spotlight_view_active: active,
      });
    },
    [role, isSynced, lastViewedSlideIndex, upsertStudentState]
  );

  const updateSlideContent = useCallback(
    async (slideIndex: number, content: string, title: string) => {
      if (role !== "teacher") return;
      setTeacherSlideContent(content);
      setTeacherSlideTitle(title);
      try {
        await supabase.rpc("update_spotlight_session_state", {
          p_session_id: sessionId,
          p_spotlight_enabled: spotlightEnabled,
          p_current_slide_content: content,
          p_current_slide_title: title,
        });
      } catch (err) {
        console.error("updateSlideContent error:", err);
      }
    },
    [role, sessionId, spotlightEnabled]
  );

  const toggleSpotlight = useCallback(
    async (enabled: boolean) => {
      if (role !== "teacher") return;
      setSpotlightEnabled(enabled);
      try {
        await supabase.rpc("update_spotlight_session_state", {
          p_session_id: sessionId,
          p_spotlight_enabled: enabled,
          p_current_slide_content: teacherSlideContent,
          p_current_slide_title: teacherSlideTitle,
        });
      } catch (err) {
        console.error("toggleSpotlight error:", err);
      }
    },
    [role, sessionId, teacherSlideContent, teacherSlideTitle]
  );

  const fetchSyncStats = useCallback(async () => {
    if (role !== "teacher") return;
    try {
      const { data, error } = await supabase.rpc("get_spotlight_sync_stats", {
        p_session_id: sessionId,
      });
      if (error) {
        console.error("fetchSyncStats error:", error.message);
        return;
      }
      if (data && mountedRef.current) {
        setSyncStats(data as unknown as SpotlightSyncStats);
      }
    } catch (err) {
      console.error("fetchSyncStats error:", err);
    }
  }, [role, sessionId]);

  // Realtime: student subscribes to spotlight_session_state + live_sessions
  useEffect(() => {
    if (role !== "student") return;

    const spotlightChannel = supabase
      .channel(`spotlight-state-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "spotlight_session_state",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const updated = payload.new as Record<string, unknown>;
          if (typeof updated.spotlight_enabled === "boolean") {
            setSpotlightEnabled(updated.spotlight_enabled);
          }
          if (typeof updated.current_slide_content === "string") {
            setTeacherSlideContent(updated.current_slide_content);
          }
          if (typeof updated.current_slide_title === "string") {
            setTeacherSlideTitle(updated.current_slide_title);
          }
        }
      )
      .subscribe();

    const sessionChannel = supabase
      .channel(`spotlight-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const updated = payload.new as Record<string, unknown>;
          if (typeof updated.current_slide_index === "number") {
            setTeacherSlideIndex(updated.current_slide_index);
            setIsSynced((prev) => {
              if (prev) {
                setLastViewedSlideIndex(updated.current_slide_index as number);
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(spotlightChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, role]);

  // Realtime: teacher subscribes to student_spotlight_state
  useEffect(() => {
    if (role !== "teacher") return;

    fetchSyncStats();

    const channel = supabase
      .channel(`spotlight-students-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_spotlight_state",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          if (mountedRef.current) fetchSyncStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, role, fetchSyncStats]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    isSynced,
    spotlightViewActive,
    lastViewedSlideIndex,
    spotlightEnabled,
    teacherSlideIndex,
    teacherSlideContent,
    teacherSlideTitle,
    syncStats,
    unlockScroll,
    resyncToTeacher,
    toggleSpotlightView,
    updateSlideContent,
    toggleSpotlight,
    fetchSyncStats,
  };
}
