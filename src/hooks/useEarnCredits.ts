import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdSession {
  session_id: string;
  type: 'rewarded_video' | 'smartlink' | 'vast';
  provider?: 'exoclick' | 'adsterra' | 'monetag';
  smartlink_url?: string;
  vast_url?: string;
  duration: 30 | 60;
  reward: number;
  is_first_ad: boolean;
  bonus: number;
  // Retry and fallback configuration
  retry_allowed?: boolean;
  fallback_allowed_after_ms?: number;
  max_retries?: number;
  retry_delay_ms?: number;
}

interface AdStats {
  ads_watched: number;
  credits_earned: number;
  ads_remaining: number;
  credits_remaining: number;
  max_ads: number;
  max_credits: number;
}

interface UseEarnCreditsResult {
  stats: AdStats | null;
  loading: boolean;
  requesting: boolean;
  completing: boolean;
  currentSession: AdSession | null;
  requestAd: (duration: 30 | 60) => Promise<AdSession | null>;
  completeAd: (sessionId: string) => Promise<boolean>;
  cancelAd: (sessionId: string) => void;
  refreshStats: () => Promise<void>;
}

export function useEarnCredits(): UseEarnCreditsResult {
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [currentSession, setCurrentSession] = useState<AdSession | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_ad_stats');
      
      if (error) {
        console.error('Failed to fetch ad stats:', error);
        return;
      }

      const result = data as { 
        success: boolean; 
        ads_watched?: number; 
        credits_earned?: number;
        ads_remaining?: number;
        credits_remaining?: number;
        max_ads?: number;
        max_credits?: number;
      };

      if (result?.success) {
        setStats({
          ads_watched: result.ads_watched ?? 0,
          credits_earned: result.credits_earned ?? 0,
          ads_remaining: result.ads_remaining ?? 10,
          credits_remaining: result.credits_remaining ?? 200,
          max_ads: result.max_ads ?? 10,
          max_credits: result.max_credits ?? 200,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const requestAd = useCallback(async (duration: 30 | 60): Promise<AdSession | null> => {
    setRequesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to earn credits');
        return null;
      }

      const response = await supabase.functions.invoke('ads-request', {
        body: { duration },
      });

      if (response.error) {
        console.error('Ad request error:', response.error);
        toast.error('Failed to start ad session');
        return null;
      }

      const data = response.data;

      if (!data.success) {
        if (data.error === 'Daily ad limit reached') {
          toast.error('Daily ad limit reached. Come back tomorrow!');
        } else if (data.error === 'Would exceed daily credit limit') {
          toast.error('Would exceed daily credit limit');
        } else {
          toast.error(data.error || 'Failed to start ad');
        }
        return null;
      }

      const adSession: AdSession = {
        session_id: data.session_id,
        type: data.type,
        smartlink_url: data.smartlink_url,
        vast_url: data.vast_url,
        duration: data.duration,
        reward: data.reward,
        is_first_ad: data.is_first_ad,
        bonus: data.bonus,
      };

      setCurrentSession(adSession);
      
      // Update stats from response
      if (data.stats) {
        setStats(data.stats);
      }

      return adSession;
    } catch (error) {
      console.error('Error requesting ad:', error);
      toast.error('Something went wrong. Please try again.');
      return null;
    } finally {
      setRequesting(false);
    }
  }, []);

  const completeAd = useCallback(async (sessionId: string): Promise<boolean> => {
    setCompleting(true);
    try {
      const response = await supabase.functions.invoke('ads-complete', {
        body: { session_id: sessionId },
      });

      if (response.error) {
        console.error('Ad complete error:', response.error);
        toast.error('Failed to complete ad');
        return false;
      }

      const data = response.data;

      if (!data.success) {
        toast.error(data.error || 'Failed to complete ad');
        return false;
      }

      // Show success message
      toast.success(`+${data.credits_added} credits added!`, {
        description: `New balance: ${data.new_balance} SC`,
      });

      // Update stats
      setStats(prev => prev ? {
        ...prev,
        ads_watched: data.ads_today,
        credits_earned: data.credits_today,
        ads_remaining: data.ads_remaining,
        credits_remaining: data.credits_remaining,
      } : null);

      setCurrentSession(null);
      return true;
    } catch (error) {
      console.error('Error completing ad:', error);
      toast.error('Something went wrong');
      return false;
    } finally {
      setCompleting(false);
    }
  }, []);

  const cancelAd = useCallback((sessionId: string) => {
    // Just clear local state - session will expire on server
    setCurrentSession(null);
    toast.info('Ad not completed. No credits added.');
  }, []);

  return {
    stats,
    loading,
    requesting,
    completing,
    currentSession,
    requestAd,
    completeAd,
    cancelAd,
    refreshStats,
  };
}
