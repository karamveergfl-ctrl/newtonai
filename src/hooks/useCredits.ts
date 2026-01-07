import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FEATURE_COSTS, AD_REWARDS, DAILY_AD_LIMITS, SIGNUP_BONUS } from '@/lib/creditConfig';
import { toast } from 'sonner';

interface UserCredits {
  credits: number;
  lifetime_earned: number;
  lifetime_spent: number;
  ads_watched_today: number;
  last_ad_date: string | null;
}

export function useCredits() {
  const [credits, setCredits] = useState<number>(0);
  const [adsWatchedToday, setAdsWatchedToday] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Fetch user credits on mount
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Check if premium
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (profile?.subscription_tier === 'premium') {
          setIsPremium(true);
        }

        // Get or create credits record
        let { data: creditsData } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!creditsData) {
          // Create new record with signup bonus
          const { data: newCredits, error } = await supabase
            .from('user_credits')
            .insert({
              user_id: user.id,
              credits: SIGNUP_BONUS,
              lifetime_earned: SIGNUP_BONUS,
            })
            .select()
            .single();

          if (!error && newCredits) {
            creditsData = newCredits;
            // Log signup bonus transaction
            await supabase.from('credit_transactions').insert({
              user_id: user.id,
              amount: SIGNUP_BONUS,
              type: 'signup_bonus',
            });
          }
        }

        if (creditsData) {
          // Reset daily ads if new day
          const today = new Date().toISOString().split('T')[0];
          if (creditsData.last_ad_date !== today) {
            setAdsWatchedToday(0);
          } else {
            setAdsWatchedToday(creditsData.ads_watched_today);
          }
          setCredits(creditsData.credits);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  // Check if user has enough credits for a feature
  const hasEnoughCredits = useCallback((feature: string): boolean => {
    if (isPremium) return true;
    const cost = FEATURE_COSTS[feature] || 0;
    return credits >= cost;
  }, [credits, isPremium]);

  // Get cost of a feature
  const getFeatureCost = useCallback((feature: string): number => {
    return FEATURE_COSTS[feature] || 0;
  }, []);

  // Spend credits on a feature
  const spendCredits = useCallback(async (feature: string): Promise<boolean> => {
    if (isPremium) return true;
    
    const cost = FEATURE_COSTS[feature] || 0;
    if (credits < cost) return false;

    if (!userId) return false;

    try {
      const newBalance = credits - cost;
      
      const { error } = await supabase
        .from('user_credits')
        .update({ 
          credits: newBalance,
          lifetime_spent: credits - newBalance,
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: -cost,
        type: 'feature_use',
        feature_name: feature,
      });

      setCredits(newBalance);
      return true;
    } catch (error) {
      console.error('Error spending credits:', error);
      return false;
    }
  }, [credits, userId, isPremium]);

  // Earn credits from watching an ad
  const earnCredits = useCallback(async (adDuration: 30 | 60): Promise<boolean> => {
    if (!userId) return false;

    const dailyLimit = isPremium ? 0 : DAILY_AD_LIMITS.logged_in;
    if (adsWatchedToday >= dailyLimit) {
      toast.error('Daily ad limit reached');
      return false;
    }

    try {
      const reward = adDuration === 30 ? AD_REWARDS['30sec'] : AD_REWARDS['60sec'];
      const today = new Date().toISOString().split('T')[0];
      
      // Add daily bonus if first ad of the day
      const isFirstAd = adsWatchedToday === 0;
      const totalReward = isFirstAd ? reward + AD_REWARDS.daily_bonus : reward;
      const newBalance = credits + totalReward;

      const { error } = await supabase
        .from('user_credits')
        .update({ 
          credits: newBalance,
          lifetime_earned: credits + totalReward,
          ads_watched_today: adsWatchedToday + 1,
          last_ad_date: today,
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: totalReward,
        type: 'ad_reward',
        ad_duration: adDuration,
      });

      setCredits(newBalance);
      setAdsWatchedToday(prev => prev + 1);
      
      toast.success(`+${totalReward} Study Credits earned!${isFirstAd ? ' (includes daily bonus!)' : ''}`);
      return true;
    } catch (error) {
      console.error('Error earning credits:', error);
      return false;
    }
  }, [credits, userId, adsWatchedToday, isPremium]);

  // Check if user can watch more ads today
  const canWatchMoreAds = useCallback((): boolean => {
    const dailyLimit = isPremium ? 0 : DAILY_AD_LIMITS.logged_in;
    return adsWatchedToday < dailyLimit;
  }, [adsWatchedToday, isPremium]);

  // Get remaining ads for today
  const getRemainingAds = useCallback((): number => {
    const dailyLimit = isPremium ? 0 : DAILY_AD_LIMITS.logged_in;
    return Math.max(0, dailyLimit - adsWatchedToday);
  }, [adsWatchedToday, isPremium]);

  return {
    credits,
    loading,
    isPremium,
    hasEnoughCredits,
    getFeatureCost,
    spendCredits,
    earnCredits,
    canWatchMoreAds,
    getRemainingAds,
    adsWatchedToday,
  };
}
