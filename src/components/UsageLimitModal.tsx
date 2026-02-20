import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Lock, Zap, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeatureShowcase } from "./FeatureShowcase";
import { getFeaturePeriodText } from "@/hooks/useFeatureLimitGate";

interface UsageLimitModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  currentUsage: number;
  limit: number;
  unit?: "per_day" | "per_month" | "minutes_per_month";
  tier?: "free" | "pro" | "ultra";
  proLimit?: number;
}

export function UsageLimitModal({ 
  open, 
  onClose, 
  featureName, 
  currentUsage, 
  limit,
  unit = "per_month",
  tier = "free",
  proLimit,
}: UsageLimitModalProps) {
  const navigate = useNavigate();
  const periodText = getFeaturePeriodText(unit);

  // Determine upgrade messaging based on tier
  const getUpgradeMessage = () => {
    if (tier === "free") {
      if (proLimit === -1) {
        return "Upgrade to Pro for unlimited access";
      }
      return proLimit ? `Upgrade to Pro for ${proLimit}/month` : "Upgrade for more access";
    }
    if (tier === "pro") {
      return "Upgrade to Ultra for unlimited access";
    }
    return "";
  };

  const upgradeButtonText = tier === "pro" ? "Upgrade to Ultra" : "Upgrade to Pro";
  const upgradeIcon = tier === "pro" ? Crown : Sparkles;
  const UpgradeIcon = upgradeIcon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
          >
            <Lock className="h-8 w-8 text-destructive" />
          </motion.div>
          <DialogTitle className="text-center">Usage Limit Reached</DialogTitle>
          <DialogDescription className="text-center">
            You've used all {limit} of your {featureName} {periodText}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{currentUsage}/{limit}</p>
            <p className="text-sm text-muted-foreground">
              Uses consumed {unit === "per_day" ? "today" : "this month"}
            </p>
          </div>

          {/* Upgrade benefit */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-foreground">
              {getUpgradeMessage()}
            </p>
          </div>

          {/* Feature showcase */}
          <FeatureShowcase compact className="my-4 hidden sm:block" />
          <FeatureShowcase compact className="my-2 sm:hidden" />

          <div className="space-y-2">
            <Button 
              onClick={() => {
                onClose();
                navigate("/pricing");
              }}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              <UpgradeIcon className="h-4 w-4 mr-2" />
              {upgradeButtonText}
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {tier === "pro" 
              ? "Ultra users get unlimited access to everything"
              : "Pro users get higher limits on all features"
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
