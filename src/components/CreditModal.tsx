import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Crown, Coins, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AD_REWARDS } from "@/lib/creditConfig";
import { useState } from "react";

interface CreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits: number;
  currentCredits: number;
  featureName: string;
  onWatchAd: (duration: 30 | 60) => Promise<boolean>;
  canWatchMoreAds: boolean;
  remainingAds: number;
}

export function CreditModal({
  open,
  onOpenChange,
  requiredCredits,
  currentCredits,
  featureName,
  onWatchAd,
  canWatchMoreAds,
  remainingAds,
}: CreditModalProps) {
  const navigate = useNavigate();
  const [watchingAd, setWatchingAd] = useState<30 | 60 | null>(null);

  const handleWatchAd = async (duration: 30 | 60) => {
    setWatchingAd(duration);
    try {
      const success = await onWatchAd(duration);
      if (success) {
        // Check if now has enough credits
        const newBalance = currentCredits + (duration === 30 ? AD_REWARDS['30sec'] : AD_REWARDS['60sec']);
        if (newBalance >= requiredCredits) {
          onOpenChange(false);
        }
      }
    } finally {
      setWatchingAd(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
          {canWatchMoreAds ? (
            <>
              <p className="text-sm text-muted-foreground">
                Earn credits by watching a short video:
              </p>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                  onClick={() => handleWatchAd(30)}
                  disabled={watchingAd !== null}
                >
                  <div className="flex items-center gap-3">
                    <Play className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">Watch 30s video</div>
                      <div className="text-xs text-muted-foreground">Quick option</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                    {watchingAd === 30 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>+{AD_REWARDS['30sec']} SC</>
                    )}
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3 border-primary/50 bg-primary/5"
                  onClick={() => handleWatchAd(60)}
                  disabled={watchingAd !== null}
                >
                  <div className="flex items-center gap-3">
                    <Play className="w-4 h-4 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Watch 60s video</div>
                      <div className="text-xs text-muted-foreground">Best value</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                    {watchingAd === 60 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>+{AD_REWARDS['60sec']} SC</>
                    )}
                  </div>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {remainingAds} videos remaining today
              </p>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                You've reached your daily video limit. Upgrade to Premium for unlimited access!
              </p>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate('/pricing');
            }}
          >
            <Crown className="w-4 h-4" />
            Upgrade to Premium
            <span className="text-xs opacity-80">Unlimited credits, no ads</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
