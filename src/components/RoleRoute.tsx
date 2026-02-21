import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface RoleRouteProps {
  children: React.ReactNode;
  role: "teacher" | "student";
}

export function RoleRoute({ children, role }: RoleRouteProps) {
  const { isTeacher, isStudent, loading } = useUserRole();
  const navigate = useNavigate();

  const hasAccess = role === "teacher" ? isTeacher : isStudent;

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
