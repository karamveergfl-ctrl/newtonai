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

export interface ConceptCheck {
  id: string;
  session_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  explanation: string | null;
  slide_context: string | null;
  status: 'active' | 'closed' | 'reviewing';
  duration_seconds: number;
  created_at: string;
  closed_at: string | null;
}

export interface ConceptCheckResults {
  total_responses: number;
  total_enrolled: number;
  response_rate: number;
  answer_distribution: {
    a: { count: number; percentage: number };
    b: { count: number; percentage: number };
    c: { count: number; percentage: number };
    d: { count: number; percentage: number };
  };
  correct_count: number;
  correct_percentage: number;
  avg_response_time_ms: number;
}

export interface ConceptCheckResponse {
  selected_answer: 'a' | 'b' | 'c' | 'd';
  is_correct: boolean;
  response_time_ms: number;
}
