import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setChecking(false);
        return;
      }

      // Delay slightly to avoid deadlock with onAuthStateChange
      await new Promise(r => setTimeout(r, 100));

      let profile = null;
      let error = null;
      
      // Retry once to handle race with handle_new_user trigger
      for (let attempt = 0; attempt < 2; attempt++) {
        const result = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .maybeSingle();
        
        profile = result.data;
        error = result.error;
        
        if (profile) break;
        if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
      }

      // Handle stale session - user exists in JWT but not in database
      if (error || !profile) {
        console.warn("Stale session detected - signing out", error);
        await supabase.auth.signOut();
        navigate("/auth", { replace: true });
        return;
      }

      if (!profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else {
        // Check if user has an institutional or teacher role and redirect accordingly
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        
        const userRoles = (roleData || []).map(r => r.role as string);
        const isInstitutional = ["principal", "dean", "exam_admin", "department_head"].some(r => userRoles.includes(r));
        const isAdmin = userRoles.includes("admin");
        const dashboardMode = (() => {
          try { return window.localStorage.getItem("newtonai_dashboard_mode"); } catch { return null; }
        })();

        if (window.location.pathname === "/dashboard") {
          // Admins who explicitly switched to student view should stay there.
          if (isAdmin && dashboardMode === "student") {
            navigate("/student/dashboard", { replace: true });
          } else if (isInstitutional) {
            navigate("/institution", { replace: true });
          } else if (userRoles.includes("teacher")) {
            navigate("/teacher", { replace: true });
          }
        }
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
