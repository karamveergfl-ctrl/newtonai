import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "teacher" | "student" | "admin" | "moderator" | "user" | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      setRole((data?.role as UserRole) ?? null);
      setLoading(false);
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    role,
    loading,
    isTeacher: role === "teacher",
    isStudent: role === "student" || role === "user" || role === null,
    isAdmin: role === "admin",
  };
}
