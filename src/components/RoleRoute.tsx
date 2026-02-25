import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface RoleRouteProps {
  children: React.ReactNode;
  role: "teacher" | "student" | "principal" | "dean" | "exam_admin" | "department_head";
}

export function RoleRoute({ children, role }: RoleRouteProps) {
  const { isTeacher, isStudent, isPrincipal, isDean, isExamAdmin, isDepartmentHead, loading } = useUserRole();
  const navigate = useNavigate();

  const roleMap: Record<string, boolean> = {
    teacher: isTeacher,
    student: isStudent,
    principal: isPrincipal,
    dean: isDean,
    exam_admin: isExamAdmin,
    department_head: isDepartmentHead,
  };
  const hasAccess = roleMap[role] ?? false;

  useEffect(() => {
    if (loading) return;
    if (!hasAccess) {
      navigate("/dashboard", { replace: true });
    }
  }, [hasAccess, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) return null;

  return <>{children}</>;
}
