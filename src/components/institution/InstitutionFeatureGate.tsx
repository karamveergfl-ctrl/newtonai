import { useInstitutionFeatureGate } from "@/hooks/useInstitutionFeatureGate";
import type { InstitutionFeature } from "@/lib/institutionTierConfig";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface InstitutionFeatureGateProps {
  feature: InstitutionFeature;
  children: React.ReactNode;
  /** If true, renders children but overlays lock. If false (default), replaces entirely. */
  overlay?: boolean;
}

export function InstitutionFeatureGate({ feature, children, overlay = false }: InstitutionFeatureGateProps) {
  const { canUse, loading, requiredTierLabel } = useInstitutionFeatureGate(feature);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (canUse) return <>{children}</>;

  if (overlay) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-30 blur-[2px] select-none">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
          <Lock className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Requires {requiredTierLabel} Plan
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Upgrade to unlock this feature
          </p>
          <Button size="sm" onClick={() => navigate("/institution/billing")}>
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {requiredTierLabel} Plan Required
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        This feature is available on the {requiredTierLabel} plan and above.
        Upgrade your institution's subscription to access it.
      </p>
      <Button onClick={() => navigate("/institution/billing")}>
        View Plans & Upgrade
      </Button>
    </div>
  );
}
