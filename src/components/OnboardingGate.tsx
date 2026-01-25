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

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .maybeSingle();

      // Handle stale session - user exists in JWT but not in database
      if (error || !profile) {
        console.warn("Stale session detected - signing out", error);
        await supabase.auth.signOut();
        setChecking(false);
        return;
      }

      if (!profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else {
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
