import { useState } from "react";
import { Coins, Crown, Play, TrendingUp, TrendingDown, Wallet, Loader2, Sparkles } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AD_REWARDS, DAILY_AD_LIMITS } from "@/lib/creditConfig";

interface CreditBalanceProps {
  className?: string;
  showLabel?: boolean;
}

export function CreditBalance({ className, showLabel = false }: CreditBalanceProps) {
  const { 
    credits, 
    loading, 
    isPremium, 
    earnCredits, 
    canWatchMoreAds, 
    getRemainingAds,
    adsWatchedToday 
  } = useCredits();
  const navigate = useNavigate();
  const [watchingAd, setWatchingAd] = useState<30 | 60 | null>(null);
  const [open, setOpen] = useState(false);

  const handleWatchAd = async (duration: 30 | 60) => {
    setWatchingAd(duration);
    try {
      await earnCredits(duration);
    } finally {
      setWatchingAd(null);
    }
  };

  if (loading) {
    return <Skeleton className="h-8 w-20" />;
  }

  if (isPremium) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:border-yellow-500/50 transition-colors cursor-pointer",
            className
          )}>
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Premium</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="end">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20">
              <Crown className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold">Premium Member</h3>
              <p className="text-sm text-muted-foreground">
                You have unlimited access to all features
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ✓ Unlimited credits • ✓ No ads • ✓ Priority support
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const dailyLimit = DAILY_AD_LIMITS.logged_in;
  const adsProgress = (adsWatchedToday / dailyLimit) * 100;
  const remainingAds = getRemainingAds();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border hover:bg-muted hover:border-primary/30 transition-colors cursor-pointer",
          className
        )}>
          <Coins className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold">{credits}</span>
          {showLabel && <span className="text-xs text-muted-foreground">SC</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header with balance */}
        <div className="p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Wallet className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">{credits} <span className="text-sm font-normal text-muted-foreground">SC</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Earn Credits Section */}
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Earn Credits
            </h4>
            
            {canWatchMoreAds() ? (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                  onClick={() => handleWatchAd(30)}
                  disabled={watchingAd !== null}
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Watch 30s video</div>
                      <div className="text-xs text-muted-foreground">Quick option</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                    {watchingAd === 30 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>+{AD_REWARDS['30sec']} SC</>
                    )}
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3 border-primary/30 bg-primary/5 hover:bg-primary/10"
                  onClick={() => handleWatchAd(60)}
                  disabled={watchingAd !== null}
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Watch 60s video</div>
                      <div className="text-xs text-muted-foreground">Best value ⭐</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                    {watchingAd === 60 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>+{AD_REWARDS['60sec']} SC</>
                    )}
                  </div>
                </Button>

                {/* Daily progress */}
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Daily videos watched</span>
                    <span>{adsWatchedToday}/{dailyLimit}</span>
                  </div>
                  <Progress value={adsProgress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {remainingAds} videos remaining today
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 px-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Daily limit reached! Come back tomorrow or upgrade to Premium.
                </p>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="pt-3 border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              Credit Usage
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{adsWatchedToday * AD_REWARDS['30sec']}</p>
                <p className="text-xs text-muted-foreground">Earned Today</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{credits}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <Button 
            className="w-full gap-2" 
            onClick={() => {
              setOpen(false);
              navigate('/pricing');
            }}
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Premium
            <span className="text-xs opacity-80">No limits</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
