import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FEATURE_COSTS as FALLBACK_COSTS, AD_REWARDS, DAILY_AD_LIMITS, SIGNUP_BONUS } from '@/lib/creditConfig';
import { toast } from 'sonner';

interface CreditsContextType {
  credits: number;
  loading: boolean;
  isPremium: boolean;
  adsWatchedToday: number;
  hasEnoughCredits: (feature: string) => boolean;
  getFeatureCost: (feature: string) => number;
  spendCredits: (feature: string) => Promise<boolean>;
  earnCredits: (adDuration: 30 | 60) => Promise<boolean>;
  canWatchMoreAds: () => boolean;
  getRemainingAds: () => number;
  refreshCredits: () => Promise<void>;
}

// Default values for when context is not available
const defaultContextValue: CreditsContextType = {
  credits: 0,
  loading: true,
  isPremium: false,
  adsWatchedToday: 0,
  hasEnoughCredits: () => false,
  getFeatureCost: (feature: string) => FALLBACK_COSTS[feature] || 0,
  spendCredits: async () => false,
  earnCredits: async () => false,
  canWatchMoreAds: () => false,
  getRemainingAds: () => 0,
  refreshCredits: async () => {},
};

const CreditsContext = createContext<CreditsContextType>(defaultContextValue);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<number>(0);
  const [adsWatchedToday, setAdsWatchedToday] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [featureCosts, setFeatureCosts] = useState<Record<string, number>>(FALLBACK_COSTS);

  // Fetch feature costs from server - runs once on mount
  const fetchFeatureCosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('feature_costs')
        .select('feature_name, cost');
      
      if (!error && data && data.length > 0) {
        const costsMap = Object.fromEntries(
          data.map(f => [f.feature_name, f.cost])
        );
        // Merge with fallback to ensure all features are covered
        setFeatureCosts(prev => ({ ...prev, ...costsMap }));
      }
    } catch (error) {
      console.error('Error fetching feature costs:', error);
      // Keep using fallback costs
    }
  }, []);

  const fetchCredits = useCallback(async () => {
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

      // Check for any paid tier (pro, premium, ultra)
      const paidTiers = ['pro', 'premium', 'ultra'];
      if (profile?.subscription_tier && paidTiers.includes(profile.subscription_tier)) {
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
  }, []);

  useEffect(() => {
    fetchFeatureCosts();
    fetchCredits();
  }, [fetchCredits, fetchFeatureCosts]);

  const hasEnoughCredits = useCallback((feature: string): boolean => {
    if (isPremium) return true;
    const cost = featureCosts[feature] || 0;
    return credits >= cost;
  }, [credits, isPremium, featureCosts]);

  const getFeatureCost = useCallback((feature: string): number => {
    return featureCosts[feature] || 0;
  }, [featureCosts]);

  const spendCredits = useCallback(async (feature: string): Promise<boolean> => {
    if (isPremium) return true;
    if (!userId) return false;

    try {
      // Use atomic RPC function - cost is looked up server-side for security
      const { data, error } = await supabase.rpc('spend_credits', {
        p_feature_name: feature
      });

      if (error) {
        console.error('RPC error:', error);
        return false;
      }

      const result = data as { success: boolean; balance?: number; cost?: number; error?: string };
      
      if (!result.success) {
        if (result.error === 'Insufficient credits') {
          // Sync local state with server
          await fetchCredits();
        }
        console.error('Spend credits failed:', result.error);
        return false;
      }

      setCredits(result.balance ?? credits);
      return true;
    } catch (error) {
      console.error('Error spending credits:', error);
      return false;
    }
  }, [credits, userId, isPremium, fetchCredits]);

  const earnCredits = useCallback(async (adDuration: 30 | 60): Promise<boolean> => {
    if (!userId) return false;

    const dailyLimit = isPremium ? 0 : DAILY_AD_LIMITS.logged_in;
    if (adsWatchedToday >= dailyLimit) {
      toast.error('Daily ad limit reached');
      return false;
    }

    try {
      const reward = adDuration === 30 ? AD_REWARDS['30sec'] : AD_REWARDS['60sec'];
      
      // Add daily bonus if first ad of the day
      const isFirstAd = adsWatchedToday === 0;
      const totalReward = isFirstAd ? reward + AD_REWARDS.daily_bonus : reward;

      // Use atomic RPC function for earning credits
      const { data, error } = await supabase.rpc('earn_credits', {
        p_ad_duration: adDuration,
        p_credits_earned: totalReward
      });

      if (error) {
        console.error('RPC error:', error);
        return false;
      }

      const result = data as { success: boolean; balance?: number; error?: string };
      
      if (!result.success) {
        if (result.error === 'Daily ad limit reached') {
          toast.error('Daily ad limit reached');
        }
        console.error('Earn credits failed:', result.error);
        return false;
      }

      setCredits(result.balance ?? credits + totalReward);
      setAdsWatchedToday(prev => prev + 1);
      
      toast.success(`+${totalReward} Study Credits earned!${isFirstAd ? ' (includes daily bonus!)' : ''}`);
      return true;
    } catch (error) {
      console.error('Error earning credits:', error);
      return false;
    }
  }, [credits, userId, adsWatchedToday, isPremium]);

  const canWatchMoreAds = useCallback((): boolean => {
    const dailyLimit = isPremium ? 0 : DAILY_AD_LIMITS.logged_in;
    return adsWatchedToday < dailyLimit;
  }, [adsWatchedToday, isPremium]);

  const getRemainingAds = useCallback((): number => {
    const dailyLimit = isPremium ? 0 : DAILY_AD_LIMITS.logged_in;
    return Math.max(0, dailyLimit - adsWatchedToday);
  }, [adsWatchedToday, isPremium]);

  return (
    <CreditsContext.Provider value={{
      credits,
      loading,
      isPremium,
      adsWatchedToday,
      hasEnoughCredits,
      getFeatureCost,
      spendCredits,
      earnCredits,
      canWatchMoreAds,
      getRemainingAds,
      refreshCredits: fetchCredits,
    }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCreditsContext() {
  return useContext(CreditsContext);
}
