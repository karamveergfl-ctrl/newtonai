export type PulseStatus = 'got_it' | 'slightly_lost' | 'lost';

export interface PulseSummary {
  got_it: number;
  slightly_lost: number;
  lost: number;
  total: number;
  confusion_percentage: number;
}

export interface LiveQuestion {
  id: string;
  session_id: string;
  content: string;
  upvotes: number;
  is_answered: boolean;
  is_pinned: boolean;
  newton_answer: string | null;
  has_upvoted: boolean;
  created_at: string;
}

export interface LiveSessionSettings {
  pulse_enabled: boolean;
  questions_enabled: boolean;
  confusion_threshold: number;
}
