import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "teacher" | "student" | "admin" | "moderator" | "user" | "principal" | "dean" | "exam_admin" | "department_head";

export function useUserRole() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = (data || []).map((r) => r.role as UserRole);
      setRoles(userRoles);
      setLoading(false);
    };

    fetchRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRoles();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Primary role priority: admin > principal > dean > department_head > exam_admin > teacher > student > user
  const role = roles.includes("admin") ? "admin"
    : roles.includes("principal") ? "principal"
    : roles.includes("dean") ? "dean"
    : roles.includes("department_head") ? "department_head"
    : roles.includes("exam_admin") ? "exam_admin"
    : roles.includes("teacher") ? "teacher"
    : roles.includes("student") ? "student"
    : roles.includes("user") ? "user"
    : null;

  const isPrincipal = roles.includes("principal");
  const isDean = roles.includes("dean");
  const isExamAdmin = roles.includes("exam_admin");
  const isDepartmentHead = roles.includes("department_head");
  const isInstitutionalAdmin = isPrincipal || isDean || isExamAdmin || isDepartmentHead;

  return {
    role,
    roles,
    loading,
    isTeacher: roles.includes("teacher"),
    isStudent: roles.includes("student") || roles.includes("user") || roles.length === 0,
    isAdmin: roles.includes("admin"),
    isPrincipal,
    isDean,
    isExamAdmin,
    isDepartmentHead,
    isInstitutionalAdmin,
  };
}
