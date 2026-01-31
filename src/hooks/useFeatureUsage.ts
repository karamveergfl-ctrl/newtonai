import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureLimit {
  name: string;
  label: string;
  limit: number;
  used: number;
  unit: "per_day" | "per_month" | "minutes_per_month";
  icon: string;
}

export interface SubscriptionInfo {
  tier: "free" | "pro" | "ultra";
  expiresAt: Date | null;
  isActive: boolean;
}

// Free tier limits
const FREE_LIMITS: Record<string, { limit: number; unit: "per_day" | "per_month" | "minutes_per_month" }> = {
  educational_videos: { limit: 20, unit: "per_month" },
  homework_help: { limit: 5, unit: "per_day" },
  ai_chat: { limit: 3, unit: "per_day" },
  flashcards: { limit: 3, unit: "per_month" },
  quiz: { limit: 3, unit: "per_month" },
  summary: { limit: 2, unit: "per_month" },
  lecture_notes: { limit: 2, unit: "per_month" },
  lecture_transcription: { limit: 20, unit: "minutes_per_month" },
  mind_map: { limit: 3, unit: "per_month" },
  ai_podcast: { limit: 1, unit: "per_month" },
};

// Pro tier - specific limits for most features
const PRO_LIMITS: Record<string, { limit: number; unit: "per_day" | "per_month" | "minutes_per_month" }> = {
  educational_videos: { limit: -1, unit: "per_month" }, // Unlimited
  homework_help: { limit: -1, unit: "per_day" }, // Unlimited
  ai_chat: { limit: -1, unit: "per_day" }, // Unlimited
  flashcards: { limit: 90, unit: "per_month" },
  quiz: { limit: 90, unit: "per_month" },
  summary: { limit: 20, unit: "per_month" },
  lecture_notes: { limit: 20, unit: "per_month" },
  lecture_transcription: { limit: 900, unit: "minutes_per_month" },
  mind_map: { limit: 90, unit: "per_month" },
  ai_podcast: { limit: 15, unit: "per_month" },
};

// Ultra tier - everything unlimited
const ULTRA_LIMITS: Record<string, { limit: number; unit: "per_day" | "per_month" | "minutes_per_month" }> = {
  educational_videos: { limit: -1, unit: "per_month" },
  homework_help: { limit: -1, unit: "per_day" },
  ai_chat: { limit: -1, unit: "per_day" },
  flashcards: { limit: -1, unit: "per_month" },
  quiz: { limit: -1, unit: "per_month" },
  summary: { limit: -1, unit: "per_month" },
  lecture_notes: { limit: -1, unit: "per_month" },
  lecture_transcription: { limit: -1, unit: "minutes_per_month" },
  mind_map: { limit: -1, unit: "per_month" },
  ai_podcast: { limit: -1, unit: "per_month" },
};

export const FEATURE_LABELS: Record<string, { label: string; icon: string }> = {
  educational_videos: { label: "Educational Videos", icon: "🎬" },
  homework_help: { label: "Homework Help", icon: "📝" },
  ai_chat: { label: "AI Chat", icon: "💬" },
  flashcards: { label: "AI Flashcards", icon: "🃏" },
  quiz: { label: "AI Quiz", icon: "❓" },
  summary: { label: "Summarizer", icon: "📄" },
  lecture_notes: { label: "Lecture Notes", icon: "🎤" },
  lecture_transcription: { label: "Live Transcription", icon: "🎙️" },
  mind_map: { label: "Mind Map", icon: "🧠" },
  ai_podcast: { label: "AI Podcast", icon: "🎙️" },
};

export function useFeatureUsage() {
  const [usage, setUsage] = useState<FeatureLimit[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    tier: "free",
    expiresAt: null,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setUserId(session.user.id);

    // Fetch subscription tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", session.user.id)
      .single();

    const tier = (profile?.subscription_tier || "free") as "free" | "pro" | "ultra";
    const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
    const isActive = tier === "free" || !expiresAt || expiresAt > new Date();

    setSubscription({ tier, expiresAt, isActive });

    // Fetch current usage - need both daily and monthly data
    // Use UTC dates to match database date_trunc behavior
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split("T")[0];

    // Fetch monthly usage
    const { data: monthlyUsageData } = await supabase
      .from("feature_usage")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("period_start", monthStart);

    // Fetch daily usage for per_day features
    const { data: dailyUsageData } = await supabase
      .from("feature_usage")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("period_start", today);

    const limits = tier === "ultra" ? ULTRA_LIMITS : tier === "pro" ? PRO_LIMITS : FREE_LIMITS;
    
    const usageList: FeatureLimit[] = Object.entries(limits).map(([name, config]) => {
      // Use daily data for per_day features, monthly for others
      const usageData = config.unit === "per_day" ? dailyUsageData : monthlyUsageData;
      const featureUsage = usageData?.find((u) => u.feature_name === name);
      const used = config.unit === "minutes_per_month" 
        ? (featureUsage?.usage_minutes || 0)
        : (featureUsage?.usage_count || 0);

      return {
        name,
        label: FEATURE_LABELS[name]?.label || name,
        limit: config.limit,
        used,
        unit: config.unit,
        icon: FEATURE_LABELS[name]?.icon || "📊",
      };
    });

    setUsage(usageList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const checkCanUse = useCallback((featureName: string): boolean => {
    // Only Ultra tier gets unlimited everything
    if (subscription.tier === "ultra") return true;
    
    const feature = usage.find((u) => u.name === featureName);
    if (!feature) return true;
    if (feature.limit === -1) return true; // This specific feature is unlimited
    
    return feature.used < feature.limit;
  }, [usage, subscription]);

  const incrementUsage = useCallback(async (featureName: string, minutes?: number) => {
    if (!userId) return false;

    try {
      // Use the secure RPC function to track usage (bypasses RLS)
      const { data, error } = await supabase.rpc('track_feature_usage', {
        p_feature_name: featureName,
        p_usage_minutes: minutes || 0,
      });

      if (error) {
        console.error('Failed to track feature usage:', error);
        return false;
      }

      // Refresh usage data after tracking
      await fetchUsage();
      return true;
    } catch (err) {
      console.error('Error tracking usage:', err);
      return false;
    }
  }, [userId, fetchUsage]);

  return {
    usage,
    subscription,
    loading,
    checkCanUse,
    incrementUsage,
    refreshUsage: fetchUsage,
  };
}
