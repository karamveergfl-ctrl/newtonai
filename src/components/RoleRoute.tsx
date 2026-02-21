import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface RoleRouteProps {
  children: React.ReactNode;
  role: "teacher" | "student";
}

export function RoleRoute({ children, role }: RoleRouteProps) {
  const { role: userRole, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (role === "teacher" && userRole !== "teacher") {
      navigate("/dashboard", { replace: true });
    }
    // Students can be 'student', 'user', or null (default)
  }, [userRole, loading, role, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === "teacher" && userRole !== "teacher") {
    return null;
  }

  return <>{children}</>;
}
