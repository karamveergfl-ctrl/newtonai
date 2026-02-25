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

// Phase 4 — Post-Class Intelligence Report

export interface SessionIntelligenceReport {
  id: string;
  session_id: string;
  class_id: string;
  teacher_id: string;
  status: 'generating' | 'ready' | 'failed';
  teacher_report: TeacherReport;
  generated_at: string;
  updated_at: string;
}

export interface TeacherReport {
  session_summary: {
    duration_minutes: number;
    total_students: number;
    active_students: number;
    engagement_rate: number;
  };
  confusion_slides: ConfusionSlide[];
  concept_check_analysis: ConceptCheckAnalysis[];
  top_unanswered_questions: UnansweredQuestion[];
  topics_to_revisit: TopicToRevisit[];
  engagement_heatmap: EngagementHeatmapItem[];
  _ai_failed?: boolean;
}

export interface ConfusionSlide {
  slide_index: number;
  slide_title: string;
  confusion_percentage: number;
  pulse_responses: number;
}

export interface ConceptCheckAnalysis {
  check_id: string;
  question: string;
  correct_percentage: number;
  most_common_wrong_answer: string;
  needs_review: boolean;
}

export interface UnansweredQuestion {
  question_id: string;
  content: string;
  upvotes: number;
  suggested_answer?: string;
}

export interface TopicToRevisit {
  topic: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface EngagementHeatmapItem {
  slide_index: number;
  slide_title: string;
  pulse_responses: number;
  annotations: number;
  questions_asked: number;
  engagement_score: number;
}

export interface StudentIntelligenceReport {
  id: string;
  session_id: string;
  student_id: string;
  status: 'generating' | 'ready' | 'failed';
  understanding_score: number;
  topic_scores: TopicScore[];
  knowledge_gaps: KnowledgeGap[];
  revision_flashcards: RevisionFlashcard[];
  video_suggestions: VideoSuggestion[];
  generated_at: string;
  updated_at: string;
}

export interface TopicScore {
  slide_index: number;
  slide_title: string;
  score: number | null;
  indicators: {
    pulse_status: 'got_it' | 'slightly_lost' | 'lost' | null;
    concept_check_correct: boolean | null;
    has_annotations: boolean;
  };
}

export interface KnowledgeGap {
  topic: string;
  slide_index: number;
  gap_reason: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RevisionFlashcard {
  front: string;
  back: string;
  topic: string;
  slide_index: number;
}

export interface VideoSuggestion {
  topic: string;
  query: string;
  slide_index: number;
}

export interface ReportVideoResult {
  id: string;
  student_report_id: string;
  topic: string;
  video_id: string;
  video_title: string;
  channel_name: string;
  thumbnail_url: string;
  duration: string;
  fetched_at: string;
}

export interface ClassReportOverview {
  total_students: number;
  reports_generated: number;
  class_average_score: number;
  score_distribution: {
    excellent: number;
    good: number;
    needs_work: number;
    struggling: number;
  };
  weakest_topic: { slide_title: string; avg_score: number };
  strongest_topic: { slide_title: string; avg_score: number };
}
