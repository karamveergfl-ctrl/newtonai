import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Coins, 
  Crown, 
  TrendingUp, 
  Gift,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Wallet
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedCreditCounter } from "@/components/AnimatedCreditCounter";
import { useCredits } from "@/hooks/useCredits";
import { useEarnCredits } from "@/hooks/useEarnCredits";
import { FEATURE_COSTS as FALLBACK_COSTS, FEATURE_NAMES, AD_REWARDS } from "@/lib/creditConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AdButton, DailyProgress, RulesCard, SmartlinkTimer } from "@/components/earn-credits";


export default function Credits() {
  const navigate = useNavigate();
  const { credits, loading: creditsLoading, isPremium, refreshCredits } = useCredits();
  const { 
    stats, 
    loading: statsLoading, 
    requesting, 
    currentSession,
    requestAd, 
    completeAd, 
    cancelAd,
    refreshStats 
  } = useEarnCredits();
  
  const [showTimer, setShowTimer] = useState(false);
  const [featureCosts, setFeatureCosts] = useState<Record<string, number>>(FALLBACK_COSTS);

  // Fetch feature costs from database
  const fetchFeatureCosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('feature_costs')
        .select('feature_name, cost');
      
      if (!error && data && data.length > 0) {
        const costsMap = Object.fromEntries(
          data.map(f => [f.feature_name, f.cost])
        );
        setFeatureCosts(prev => ({ ...prev, ...costsMap }));
      }
    } catch (error) {
      console.error('Error fetching feature costs:', error);
    }
  }, []);

  useEffect(() => {
    fetchFeatureCosts();
  }, [fetchFeatureCosts]);

  const handleWatchAd = async (duration: 30 | 60) => {
    const session = await requestAd(duration);
    if (session) {
      // Only use Smartlink now (ExoClick ads removed)
      if (session.smartlink_url) {
        console.log('[AD_DEBUG] Opening Smartlink timer');
        setShowTimer(true);
      }
    }
  };

  const handleAdComplete = async (sessionId: string) => {
    const success = await completeAd(sessionId);
    if (success) {
      setShowTimer(false);
      // Refresh credits after successful completion
      await refreshCredits();
      await refreshStats();
    }
  };

  const handleAdCancel = (sessionId: string) => {
    cancelAd(sessionId);
    setShowTimer(false);
  };

  const loading = creditsLoading || statsLoading;

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="container max-w-4xl py-8 px-4 space-y-6">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Earn Credits", href: "/credits" },
  ];

  const canEarnMore = stats && stats.ads_remaining > 0 && stats.credits_remaining > 0;

  return (
    <AppLayout showFooter={false}>
      <SEOHead
        title="Earn Credits"
        description="Earn free study credits by watching short videos. Use credits to unlock AI-powered study tools like quizzes, flashcards, and more."
        canonicalPath="/credits"
        breadcrumbs={breadcrumbs}
        noIndex={true}
      />
      
      {/* Smartlink Timer Dialog */}
      {currentSession && currentSession.smartlink_url && (
        <SmartlinkTimer
          open={showTimer}
          duration={currentSession.duration}
          reward={currentSession.reward}
          sessionId={currentSession.session_id}
          smartlinkUrl={currentSession.smartlink_url}
          onComplete={handleAdComplete}
          onCancel={handleAdCancel}
        />
      )}

      <div className="container max-w-4xl py-8 px-4 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Coins className="w-8 h-8 text-yellow-500" />
            Earn Credits
          </h1>
          <p className="text-muted-foreground">
            Watch short videos to earn study credits
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
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-yellow-500/20">
                    <Wallet className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <div className="flex items-center gap-2 text-3xl">
                      <AnimatedCreditCounter value={credits} showLabel className="text-3xl [&_svg]:w-7 [&_svg]:h-7" />
                    </div>
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
                    variant="outline"
                  >
                    <Crown className="w-4 h-4" />
                    Go Premium
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Earn Section */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Daily Progress */}
            {stats && (
              <DailyProgress
                adsWatched={stats.ads_watched}
                maxAds={stats.max_ads}
                creditsEarned={stats.credits_earned}
                maxCredits={stats.max_credits}
              />
            )}

            {/* Rules Card */}
            <RulesCard />
          </motion.div>
        )}

        {/* Watch & Earn Section */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Watch & Earn
                </CardTitle>
                <CardDescription>
                  Choose a video to watch and earn credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {canEarnMore ? (
                  <>
                    {/* First ad bonus message */}
                    {stats?.ads_watched === 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <Sparkles className="w-5 h-5 text-green-500 shrink-0" />
                        <p className="text-sm text-green-600 dark:text-green-400">
                          <span className="font-medium">First video bonus!</span> Your first video today earns +5 extra credits!
                        </p>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <AdButton
                        duration={30}
                        reward={stats?.ads_watched === 0 ? AD_REWARDS['30sec'] + AD_REWARDS.daily_bonus : AD_REWARDS['30sec']}
                        loading={requesting}
                        disabled={requesting}
                        onClick={() => handleWatchAd(30)}
                      />
                      <AdButton
                        duration={60}
                        reward={stats?.ads_watched === 0 ? AD_REWARDS['60sec'] + AD_REWARDS.daily_bonus : AD_REWARDS['60sec']}
                        loading={requesting}
                        disabled={requesting}
                        isBestValue
                        onClick={() => handleWatchAd(60)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 px-6 rounded-lg bg-muted/50">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h3 className="font-semibold mb-1">Daily Limit Reached!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {stats?.ads_remaining === 0 
                        ? "You've watched all available videos today." 
                        : "You've earned the maximum credits for today."}
                    </p>
                    <Button 
                      variant="default"
                      onClick={() => navigate('/pricing')}
                      className="gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade for Unlimited
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Credit Costs Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
                {Object.entries(featureCosts).map(([feature, cost]) => (
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
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Skip the Ads - Go Premium
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
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
