// Credit costs for features
export const FEATURE_COSTS: Record<string, number> = {
  quiz: 8,
  flashcards: 6,
  homework_help: 12,
  mind_map: 5,
  summary: 4,
  ai_chat: 5,
  ai_notes: 4,
  lecture_notes: 6,
  watch_video: 2,
  ai_podcast: 10,
};

// Credit rewards from ads
export const AD_REWARDS = {
  '30sec': 4,
  '60sec': 9,
  daily_bonus: 2,
};

// Daily limits for ad watching
export const DAILY_AD_LIMITS = {
  free: 8,
  logged_in: 12,
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
  ai_notes: 'AI Notes',
  lecture_notes: 'Lecture Notes',
  watch_video: 'Watch Video',
  ai_podcast: 'AI Podcast',
};
