import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface InstitutionRouteProps {
  children: React.ReactNode;
}

export function InstitutionRoute({ children }: InstitutionRouteProps) {
  const { isInstitutionalAdmin, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isInstitutionalAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [isInstitutionalAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isInstitutionalAdmin) return null;

  return <>{children}</>;
}
