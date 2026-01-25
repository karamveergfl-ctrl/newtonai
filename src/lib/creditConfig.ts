// Credit costs for features
export const FEATURE_COSTS: Record<string, number> = {
  quiz: 8,
  flashcards: 6,
  homework_help: 12,
  mind_map: 5,
  summary: 4,
  ai_chat: 5,
  lecture_notes: 6,
  watch_video: 2,
  ai_podcast: 10,
};

// Credit rewards from ads (updated values)
export const AD_REWARDS = {
  '30sec': 10,
  '60sec': 20,
  daily_bonus: 5,
};

// Daily limits for earning credits
export const DAILY_LIMITS = {
  max_ads: 10,
  max_credits: 200,
};

// Legacy daily ad limits (kept for backwards compatibility)
export const DAILY_AD_LIMITS = {
  free: 10,
  logged_in: 10,
  premium: 0, // Premium users don't need ads
};

// Initial credits for new users
export const SIGNUP_BONUS = 10;

// Feature display names
export const FEATURE_NAMES: Record<string, string> = {
  quiz: 'Generate Quiz',
  flashcards: 'Generate Flashcards',
  homework_help: 'Homework Help',
  mind_map: 'Mind Map',
  summary: 'Summary',
  ai_chat: 'AI Chat',
  lecture_notes: 'Lecture Notes',
  watch_video: 'Watch Video',
  ai_podcast: 'AI Podcast',
};
