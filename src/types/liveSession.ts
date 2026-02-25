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

// Phase 3 — Live Notes Co-Pilot

export interface NoteItem {
  type: 'heading' | 'key_point' | 'detail' | 'remember' | 'example';
  content: string;
}

export interface SessionSlideNotes {
  id: string;
  session_id: string;
  slide_index: number;
  slide_title: string | null;
  slide_context: string;
  ai_notes: NoteItem[];
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface StudentAnnotation {
  id: string;
  note_item_index: number;
  annotation_type: 'text_note' | 'star';
  content: string;
  created_at: string;
}

export interface NotesExportRecord {
  id: string;
  session_id: string;
  student_id: string;
  exported_at: string;
  format: 'pdf' | 'docx' | 'md';
  file_path: string | null;
}
