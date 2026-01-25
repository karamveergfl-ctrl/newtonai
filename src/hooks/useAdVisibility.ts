import { useCredits } from '@/hooks/useCredits';

/**
 * Hook to determine if ads should be shown to the current user.
 * Ads are only shown to free users, not premium/pro/ultra subscribers.
 */
export function useAdVisibility() {
  const { isPremium, loading } = useCredits();
  
  return {
    // Only show ads to non-premium users after loading completes
    shouldShowAd: !loading && !isPremium,
    loading
  };
}
