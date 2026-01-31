import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeatureShowcase } from "./FeatureShowcase";

interface CreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits: number;
  currentCredits: number;
  featureName: string;
}

export function CreditModal({
  open,
  onOpenChange,
  requiredCredits,
  currentCredits,
  featureName,
}: CreditModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            Study Credits Needed
          </DialogTitle>
          <DialogDescription>
            {featureName} requires {requiredCredits} credits. You have {currentCredits} credits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Upgrade to Premium for unlimited access to all features without credit limits.
            </p>
          </div>

          {/* Compact feature showcase */}
          <FeatureShowcase compact className="my-2" />

          <Button
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate('/pricing');
            }}
          >
            <Crown className="w-4 h-4" />
            Upgrade to Premium
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}