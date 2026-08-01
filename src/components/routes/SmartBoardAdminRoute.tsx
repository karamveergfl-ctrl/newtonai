import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Requires a signed-in user who administers a SmartBoard school. */
export function SmartBoardAdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        if (!cancelled) navigate("/smartboard-admin/login", { replace: true });
        return;
      }
      const { data } = await supabase
        .from("sb_institution_admins")
        .select("institution_id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) setState("allowed");
      else {
        setState("denied");
        navigate("/smartboard-admin/login", { replace: true, state: { noAccess: true } });
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (state === "denied") return null;
  return <>{children}</>;
}

export default SmartBoardAdminRoute;