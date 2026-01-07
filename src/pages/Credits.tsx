import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Coins, 
  Crown, 
  Play, 
  Loader2, 
  TrendingUp, 
  Gift,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedCreditCounter } from "@/components/AnimatedCreditCounter";
import { useCredits } from "@/hooks/useCredits";
import { AD_REWARDS, DAILY_AD_LIMITS, FEATURE_COSTS, FEATURE_NAMES } from "@/lib/creditConfig";
import { Skeleton } from "@/components/ui/skeleton";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function Credits() {
  const navigate = useNavigate();
  const { 
    credits, 
    loading, 
    isPremium, 
    earnCredits, 
    canWatchMoreAds, 
    getRemainingAds,
    adsWatchedToday 
  } = useCredits();
  
  const [watchingAd, setWatchingAd] = useState<30 | 60 | null>(null);
  const adInitialized = useRef(false);

  // Initialize Google AdSense ads
  useEffect(() => {
    if (!loading && !isPremium && !adInitialized.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adInitialized.current = true;
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [loading, isPremium]);

  const handleWatchAd = async (duration: 30 | 60) => {
    setWatchingAd(duration);
    try {
      await earnCredits(duration);
    } finally {
      setWatchingAd(null);
    }
  };

  const dailyLimit = DAILY_AD_LIMITS.logged_in;
  const adsProgress = (adsWatchedToday / dailyLimit) * 100;
  const remainingAds = getRemainingAds();

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="container max-w-4xl py-8 px-4 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="container max-w-4xl py-8 px-4 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Coins className="w-8 h-8 text-yellow-500" />
            Study Credits
          </h1>
          <p className="text-muted-foreground">
            Earn credits to unlock AI-powered study tools
          </p>
        </motion.div>

        {/* Current Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 via-background to-yellow-500/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <div className="flex items-center gap-3 text-3xl">
                    <AnimatedCreditCounter value={credits} showLabel className="text-3xl [&_svg]:w-8 [&_svg]:h-8" />
                  </div>
                </div>
                
                {isPremium ? (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 text-base">
                    <Crown className="w-4 h-4 mr-2" />
                    Premium Member
                  </Badge>
                ) : (
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Premium
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Earn Credits Section */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Earn Free Credits
                </CardTitle>
                <CardDescription>
                  Watch short videos to earn study credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Daily Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily videos watched</span>
                    <span className="font-medium">{adsWatchedToday} / {dailyLimit}</span>
                  </div>
                  <Progress value={adsProgress} className="h-2" />
                  {remainingAds > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {remainingAds} videos remaining today
                    </p>
                  ) : (
                    <p className="text-xs text-yellow-600">
                      Daily limit reached! Come back tomorrow or upgrade to Premium.
                    </p>
                  )}
                </div>

                {/* Ad Options */}
                {canWatchMoreAds() ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* 30 Second Ad */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-auto p-4 flex flex-col items-start gap-2"
                        onClick={() => handleWatchAd(30)}
                        disabled={watchingAd !== null}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Play className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">30 Second Video</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Quick option
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-yellow-600 bg-yellow-500/10">
                            {watchingAd === 30 ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>+{AD_REWARDS['30sec']} SC</>
                            )}
                          </Badge>
                        </div>
                      </Button>
                    </motion.div>

                    {/* 60 Second Ad */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-auto p-4 flex flex-col items-start gap-2 border-primary/50 bg-primary/5"
                        onClick={() => handleWatchAd(60)}
                        disabled={watchingAd !== null}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="p-2 rounded-full bg-primary/20">
                            <Play className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">60 Second Video</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Best value
                            </div>
                          </div>
                          <Badge className="bg-yellow-500 text-white">
                            {watchingAd === 60 ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>+{AD_REWARDS['60sec']} SC</>
                            )}
                          </Badge>
                        </div>
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="text-center py-4 px-6 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">
                      You've watched all available videos today.
                    </p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => navigate('/pricing')}
                    >
                      Upgrade for unlimited access
                    </Button>
                  </div>
                )}

                {/* Google Ad Placement Zone */}
                <div className="mt-6 rounded-lg overflow-hidden">
                  <ins 
                    className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-client="ca-pub-8032920863696759"
                    data-ad-slot="3142749567"
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Credit Costs Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Feature Credit Costs
              </CardTitle>
              <CardDescription>
                How many credits each feature uses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(FEATURE_COSTS).map(([feature, cost]) => (
                  <div 
                    key={feature}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm font-medium">
                      {FEATURE_NAMES[feature] || feature}
                    </span>
                    <Badge variant="outline" className="text-yellow-600">
                      {cost} SC
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Benefits */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Premium Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Unlimited credits - no daily limits",
                    "No ads - pure study experience", 
                    "Priority AI processing",
                    "Access to all features",
                    "Early access to new tools"
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-6 gap-2"
                  onClick={() => navigate('/pricing')}
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bottom Ad Placement */}
        {!isPremium && (
          <div className="rounded-lg overflow-hidden">
            <ins 
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-8032920863696759"
              data-ad-slot="3142749567"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
