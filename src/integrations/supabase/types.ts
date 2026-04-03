export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_sessions: {
        Row: {
          ad_type: string
          completed_at: string | null
          created_at: string | null
          duration: number
          id: string
          reward: number
          status: string
          user_id: string
        }
        Insert: {
          ad_type?: string
          completed_at?: string | null
          created_at?: string | null
          duration: number
          id?: string
          reward: number
          status?: string
          user_id: string
        }
        Update: {
          ad_type?: string
          completed_at?: string | null
          created_at?: string | null
          duration?: number
          id?: string
          reward?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          answers: Json
          assignment_id: string | null
          content: Json | null
          graded_at: string | null
          id: string
          score: number | null
          session_id: string | null
          status: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          answers?: Json
          assignment_id?: string | null
          content?: Json | null
          graded_at?: string | null
          id?: string
          score?: number | null
          session_id?: string | null
          status?: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          answers?: Json
          assignment_id?: string | null
          content?: Json | null
          graded_at?: string | null
          id?: string
          score?: number | null
          session_id?: string | null
          status?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: string
          class_id: string
          content: Json
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean
          max_score: number | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assignment_type?: string
          class_id: string
          content?: Json
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean
          max_score?: number | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          class_id?: string
          content?: Json
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean
          max_score?: number | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          auto_marked: boolean
          class_id: string
          id: string
          marked_at: string | null
          participation_score: number | null
          session_id: string
          status: string
          student_id: string
        }
        Insert: {
          auto_marked?: boolean
          class_id: string
          id?: string
          marked_at?: string | null
          participation_score?: number | null
          session_id: string
          status?: string
          student_id: string
        }
        Update: {
          auto_marked?: boolean
          class_id?: string
          id?: string
          marked_at?: string | null
          participation_score?: number | null
          session_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_announcements: {
        Row: {
          class_id: string
          created_at: string
          id: string
          is_pinned: boolean
          message: string
          teacher_id: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          message: string
          teacher_id: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          message?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_join_codes: {
        Row: {
          attempted_at: string
          code: string
          id: string
          success: boolean
          user_id: string
        }
        Insert: {
          attempted_at?: string
          code: string
          id?: string
          success?: boolean
          user_id: string
        }
        Update: {
          attempted_at?: string
          code?: string
          id?: string
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      class_materials: {
        Row: {
          class_id: string
          content_ref: string | null
          created_at: string
          description: string | null
          id: string
          is_visible: boolean
          material_type: string
          teacher_id: string
          title: string
        }
        Insert: {
          class_id: string
          content_ref?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          material_type?: string
          teacher_id: string
          title: string
        }
        Update: {
          class_id?: string
          content_ref?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          material_type?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          course_id: string | null
          created_at: string
          description: string | null
          grade_level: string | null
          id: string
          invite_code: string
          is_active: boolean
          max_students: number
          name: string
          section: string | null
          settings: Json
          subject: string | null
          teacher_id: string
          thumbnail: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          invite_code?: string
          is_active?: boolean
          max_students?: number
          name: string
          section?: string | null
          settings?: Json
          subject?: string | null
          teacher_id: string
          thumbnail?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          invite_code?: string
          is_active?: boolean
          max_students?: number
          name?: string
          section?: string | null
          settings?: Json
          subject?: string | null
          teacher_id?: string
          thumbnail?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_check_responses: {
        Row: {
          check_id: string
          created_at: string
          id: string
          is_correct: boolean
          response_time_ms: number | null
          selected_answer: string
          student_id: string
        }
        Insert: {
          check_id: string
          created_at?: string
          id?: string
          is_correct: boolean
          response_time_ms?: number | null
          selected_answer: string
          student_id: string
        }
        Update: {
          check_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          response_time_ms?: number | null
          selected_answer?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_check_responses_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "concept_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_check_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_checks: {
        Row: {
          closed_at: string | null
          correct_answer: string
          created_at: string
          duration_seconds: number
          explanation: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          session_id: string
          slide_context: string | null
          status: string
        }
        Insert: {
          closed_at?: string | null
          correct_answer: string
          created_at?: string
          duration_seconds?: number
          explanation?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          session_id: string
          slide_context?: string | null
          status?: string
        }
        Update: {
          closed_at?: string | null
          correct_answer?: string
          created_at?: string
          duration_seconds?: number
          explanation?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
          session_id?: string
          slide_context?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_checks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_year: string | null
          course_code: string | null
          course_name: string
          created_at: string | null
          department_id: string
          id: string
          semester: string | null
          teacher_id: string
        }
        Insert: {
          academic_year?: string | null
          course_code?: string | null
          course_name: string
          created_at?: string | null
          department_id: string
          id?: string
          semester?: string | null
          teacher_id: string
        }
        Update: {
          academic_year?: string | null
          course_code?: string | null
          course_name?: string
          created_at?: string | null
          department_id?: string
          id?: string
          semester?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          ad_duration: number | null
          amount: number
          created_at: string
          feature_name: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          ad_duration?: number | null
          amount: number
          created_at?: string
          feature_name?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          ad_duration?: number | null
          amount?: number
          created_at?: string
          feature_name?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          head_user_id: string | null
          id: string
          institution_id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          head_user_id?: string | null
          id?: string
          institution_id: string
          name: string
        }
        Update: {
          created_at?: string | null
          head_user_id?: string | null
          id?: string
          institution_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          heading: string | null
          id: string
          page_number: number
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          heading?: string | null
          id?: string
          page_number: number
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          heading?: string | null
          id?: string
          page_number?: number
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_file_paths: {
        Row: {
          created_at: string | null
          document_id: string
          file_path: string
          id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          file_path: string
          id?: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          file_path?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_file_paths_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_inquiries: {
        Row: {
          company: string
          created_at: string | null
          email: string
          first_name: string
          id: string
          job_title: string
          last_name: string
          message: string | null
          status: string | null
          team_size: string
          updated_at: string | null
          use_case: string
        }
        Insert: {
          company: string
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          job_title: string
          last_name: string
          message?: string | null
          status?: string | null
          team_size: string
          updated_at?: string | null
          use_case: string
        }
        Update: {
          company?: string
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          job_title?: string
          last_name?: string
          message?: string | null
          status?: string | null
          team_size?: string
          updated_at?: string | null
          use_case?: string
        }
        Relationships: []
      }
      feature_costs: {
        Row: {
          cost: number
          created_at: string
          feature_name: string
          id: string
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          feature_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          feature_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          created_at: string
          feature_name: string
          id: string
          period_start: string
          updated_at: string
          usage_count: number
          usage_minutes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          id?: string
          period_start?: string
          updated_at?: string
          usage_count?: number
          usage_minutes?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          id?: string
          period_start?: string
          updated_at?: string
          usage_count?: number
          usage_minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      generation_history: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          result_preview: Json | null
          source_preview: string | null
          source_type: string | null
          title: string | null
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          result_preview?: Json | null
          source_preview?: string | null
          source_type?: string | null
          title?: string | null
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          result_preview?: Json | null
          source_preview?: string | null
          source_type?: string | null
          title?: string | null
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      institution_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          institution_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          institution_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          institution_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_audit_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_members: {
        Row: {
          id: string
          institution_id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          institution_id: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          institution_id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_members_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_payments: {
        Row: {
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          id: string
          institution_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          subscription_id: string
        }
        Insert: {
          amount: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          institution_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          subscription_id: string
        }
        Update: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          institution_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_payments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "institution_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          institution_id: string
          plan_tier: string
          price_per_student: number
          price_per_teacher: number
          status: string
          student_seats: number
          teacher_seats: number
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          institution_id: string
          plan_tier?: string
          price_per_student?: number
          price_per_teacher?: number
          status?: string
          student_seats?: number
          teacher_seats?: number
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          institution_id?: string
          plan_tier?: string
          price_per_student?: number
          price_per_teacher?: number
          status?: string
          student_seats?: number
          teacher_seats?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_subscriptions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: true
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          admin_user_id: string
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          timezone: string | null
          type: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          timezone?: string | null
          type?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          timezone?: string | null
          type?: string
        }
        Relationships: []
      }
      lecture_captures: {
        Row: {
          audio_duration_seconds: number | null
          created_at: string | null
          id: string
          session_id: string
          slide_timeline: Json | null
          status: string | null
          teacher_id: string
          transcript_segments: Json | null
          updated_at: string | null
          whiteboard_paths: string[] | null
        }
        Insert: {
          audio_duration_seconds?: number | null
          created_at?: string | null
          id?: string
          session_id: string
          slide_timeline?: Json | null
          status?: string | null
          teacher_id: string
          transcript_segments?: Json | null
          updated_at?: string | null
          whiteboard_paths?: string[] | null
        }
        Update: {
          audio_duration_seconds?: number | null
          created_at?: string | null
          id?: string
          session_id?: string
          slide_timeline?: Json | null
          status?: string | null
          teacher_id?: string
          transcript_segments?: Json | null
          updated_at?: string | null
          whiteboard_paths?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "lecture_captures_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_pulse_responses: {
        Row: {
          created_at: string
          id: string
          session_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_pulse_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_pulse_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_question_upvotes: {
        Row: {
          id: string
          question_id: string
          student_id: string
        }
        Insert: {
          id?: string
          question_id: string
          student_id: string
        }
        Update: {
          id?: string
          question_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_question_upvotes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "live_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_question_upvotes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_questions: {
        Row: {
          content: string
          created_at: string
          id: string
          is_answered: boolean
          is_pinned: boolean
          newton_answer: string | null
          session_id: string
          upvotes: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_pinned?: boolean
          newton_answer?: string | null
          session_id: string
          upvotes?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_pinned?: boolean
          newton_answer?: string | null
          session_id?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          assignment_id: string | null
          class_id: string
          confusion_threshold: number
          content_source: string
          content_text: string | null
          content_title: string | null
          created_at: string
          current_slide_index: number
          id: string
          notes_enabled: boolean
          pulse_enabled: boolean
          questions_enabled: boolean
          quiz_ended_at: string | null
          quiz_started_at: string | null
          started_at: string
          status: string
          teacher_id: string
          time_limit_minutes: number
          title: string
          total_slides: number
          whiteboard_data: Json | null
        }
        Insert: {
          assignment_id?: string | null
          class_id: string
          confusion_threshold?: number
          content_source?: string
          content_text?: string | null
          content_title?: string | null
          created_at?: string
          current_slide_index?: number
          id?: string
          notes_enabled?: boolean
          pulse_enabled?: boolean
          questions_enabled?: boolean
          quiz_ended_at?: string | null
          quiz_started_at?: string | null
          started_at?: string
          status?: string
          teacher_id: string
          time_limit_minutes?: number
          title: string
          total_slides?: number
          whiteboard_data?: Json | null
        }
        Update: {
          assignment_id?: string | null
          class_id?: string
          confusion_threshold?: number
          content_source?: string
          content_text?: string | null
          content_title?: string | null
          created_at?: string
          current_slide_index?: number
          id?: string
          notes_enabled?: boolean
          pulse_enabled?: boolean
          questions_enabled?: boolean
          quiz_ended_at?: string | null
          quiz_started_at?: string | null
          started_at?: string
          status?: string
          teacher_id?: string
          time_limit_minutes?: number
          title?: string
          total_slides?: number
          whiteboard_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      newton_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      newton_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "newton_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "newton_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_chat_messages: {
        Row: {
          citations: Json | null
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          citations?: Json | null
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          citations?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pdf_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_chat_sessions: {
        Row: {
          context_mode: string | null
          created_at: string | null
          document_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_mode?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_mode?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_chat_sessions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_documents: {
        Row: {
          created_at: string | null
          file_name: string
          id: string
          is_scanned: boolean | null
          ocr_enabled: boolean | null
          processing_status: string | null
          total_pages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          id?: string
          is_scanned?: boolean | null
          ocr_enabled?: boolean | null
          processing_status?: string | null
          total_pages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          id?: string
          is_scanned?: boolean | null
          ocr_enabled?: boolean | null
          processing_status?: string | null
          total_pages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          audio_segments: Json | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          language: string | null
          script: Json
          source_content: string | null
          title: string
          user_id: string
        }
        Insert: {
          audio_segments?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          language?: string | null
          script: Json
          source_content?: string | null
          title: string
          user_id: string
        }
        Update: {
          audio_segments?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          language?: string | null
          script?: Json
          source_content?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          education_level: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          language_preference: string | null
          onboarding_completed: boolean | null
          preferred_currency: string | null
          referral_source: string | null
          study_goals: string[] | null
          subjects: string[] | null
          subscription_expires_at: string | null
          subscription_tier: string
          teacher_preferences: Json | null
          theme_preference: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education_level?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          language_preference?: string | null
          onboarding_completed?: boolean | null
          preferred_currency?: string | null
          referral_source?: string | null
          study_goals?: string[] | null
          subjects?: string[] | null
          subscription_expires_at?: string | null
          subscription_tier?: string
          teacher_preferences?: Json | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education_level?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          onboarding_completed?: boolean | null
          preferred_currency?: string | null
          referral_source?: string | null
          study_goals?: string[] | null
          subjects?: string[] | null
          subscription_expires_at?: string | null
          subscription_tier?: string
          teacher_preferences?: Json | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_config: {
        Row: {
          created_at: string
          function_name: string
          id: string
          max_requests: number
          updated_at: string
          window_minutes: number
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          max_requests?: number
          updated_at?: string
          window_minutes?: number
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          max_requests?: number
          updated_at?: string
          window_minutes?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      redeem_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_percent: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      redeemed_codes: {
        Row: {
          applied_to_payment_id: string | null
          code_id: string
          discount_percent: number
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          applied_to_payment_id?: string | null
          code_id: string
          discount_percent: number
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          applied_to_payment_id?: string | null
          code_id?: string
          discount_percent?: number
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeemed_codes_applied_to_payment_id_fkey"
            columns: ["applied_to_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeemed_codes_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "redeem_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      report_video_results: {
        Row: {
          channel_name: string
          duration: string
          fetched_at: string
          id: string
          student_report_id: string
          thumbnail_url: string
          topic: string
          video_id: string
          video_title: string
        }
        Insert: {
          channel_name: string
          duration: string
          fetched_at?: string
          id?: string
          student_report_id: string
          thumbnail_url: string
          topic: string
          video_id: string
          video_title: string
        }
        Update: {
          channel_name?: string
          duration?: string
          fetched_at?: string
          id?: string
          student_report_id?: string
          thumbnail_url?: string
          topic?: string
          video_id?: string
          video_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_video_results_student_report_id_fkey"
            columns: ["student_report_id"]
            isOneToOne: false
            referencedRelation: "student_intelligence_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          is_question: boolean | null
          search_query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_question?: boolean | null
          search_query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_question?: boolean | null
          search_query?: string
          user_id?: string
        }
        Relationships: []
      }
      session_intelligence_reports: {
        Row: {
          class_id: string
          generated_at: string
          id: string
          session_id: string
          status: string
          teacher_id: string
          teacher_report: Json
          updated_at: string
        }
        Insert: {
          class_id: string
          generated_at?: string
          id?: string
          session_id: string
          status?: string
          teacher_id: string
          teacher_report?: Json
          updated_at?: string
        }
        Update: {
          class_id?: string
          generated_at?: string
          id?: string
          session_id?: string
          status?: string
          teacher_id?: string
          teacher_report?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_intelligence_reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_intelligence_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_intelligence_reports_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes_export: {
        Row: {
          exported_at: string
          file_path: string
          format: string
          id: string
          session_id: string
          student_id: string
        }
        Insert: {
          exported_at?: string
          file_path: string
          format: string
          id?: string
          session_id: string
          student_id: string
        }
        Update: {
          exported_at?: string
          file_path?: string
          format?: string
          id?: string
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_export_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_export_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_slide_notes: {
        Row: {
          ai_notes: Json
          created_at: string
          id: string
          session_id: string
          slide_context: string
          slide_index: number
          slide_title: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_notes?: Json
          created_at?: string
          id?: string
          session_id: string
          slide_context: string
          slide_index: number
          slide_title?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_notes?: Json
          created_at?: string
          id?: string
          session_id?: string
          slide_context?: string
          slide_index?: number
          slide_title?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_slide_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      slide_term_definitions: {
        Row: {
          created_at: string
          id: string
          session_id: string
          slide_index: number
          status: string
          terms: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          slide_index: number
          status?: string
          terms?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          slide_index?: number
          status?: string
          terms?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slide_term_definitions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      spotlight_session_state: {
        Row: {
          current_slide_content: string | null
          current_slide_title: string | null
          id: string
          session_id: string
          spotlight_enabled: boolean
          updated_at: string
        }
        Insert: {
          current_slide_content?: string | null
          current_slide_title?: string | null
          id?: string
          session_id: string
          spotlight_enabled?: boolean
          updated_at?: string
        }
        Update: {
          current_slide_content?: string | null
          current_slide_title?: string | null
          id?: string
          session_id?: string
          spotlight_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_session_state_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_intelligence_reports: {
        Row: {
          generated_at: string
          id: string
          knowledge_gaps: Json
          revision_flashcards: Json
          session_id: string
          status: string
          student_id: string
          topic_scores: Json
          understanding_score: number
          updated_at: string
          video_suggestions: Json
        }
        Insert: {
          generated_at?: string
          id?: string
          knowledge_gaps?: Json
          revision_flashcards?: Json
          session_id: string
          status?: string
          student_id: string
          topic_scores?: Json
          understanding_score?: number
          updated_at?: string
          video_suggestions?: Json
        }
        Update: {
          generated_at?: string
          id?: string
          knowledge_gaps?: Json
          revision_flashcards?: Json
          session_id?: string
          status?: string
          student_id?: string
          topic_scores?: Json
          understanding_score?: number
          updated_at?: string
          video_suggestions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "student_intelligence_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_intelligence_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_marks: {
        Row: {
          academic_year: string | null
          assignment_marks: number | null
          attendance_marks: number | null
          class_id: string
          course_id: string
          created_at: string | null
          endsem: number | null
          grade: string | null
          id: string
          midsem1: number | null
          midsem2: number | null
          practical_marks: number | null
          project_marks: number | null
          semester: string | null
          student_id: string
          total_marks: number | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          assignment_marks?: number | null
          attendance_marks?: number | null
          class_id: string
          course_id: string
          created_at?: string | null
          endsem?: number | null
          grade?: string | null
          id?: string
          midsem1?: number | null
          midsem2?: number | null
          practical_marks?: number | null
          project_marks?: number | null
          semester?: string | null
          student_id: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          assignment_marks?: number | null
          attendance_marks?: number | null
          class_id?: string
          course_id?: string
          created_at?: string | null
          endsem?: number | null
          grade?: string | null
          id?: string
          midsem1?: number | null
          midsem2?: number | null
          practical_marks?: number | null
          project_marks?: number | null
          semester?: string | null
          student_id?: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_marks_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_marks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_note_annotations: {
        Row: {
          annotations: Json
          created_at: string
          id: string
          slide_note_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          annotations?: Json
          created_at?: string
          id?: string
          slide_note_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          annotations?: Json
          created_at?: string
          id?: string
          slide_note_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_note_annotations_slide_note_id_fkey"
            columns: ["slide_note_id"]
            isOneToOne: false
            referencedRelation: "session_slide_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_note_annotations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_spotlight_state: {
        Row: {
          id: string
          is_synced: boolean
          last_viewed_slide_index: number
          session_id: string
          spotlight_view_active: boolean
          student_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_synced?: boolean
          last_viewed_slide_index?: number
          session_id: string
          spotlight_view_active?: boolean
          student_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_synced?: boolean
          last_viewed_slide_index?: number
          session_id?: string
          spotlight_view_active?: boolean
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_spotlight_state_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_spotlight_state_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          pdf_name: string
          session_end: string | null
          session_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pdf_name: string
          session_end?: string | null
          session_start?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pdf_name?: string
          session_end?: string | null
          session_start?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string
          razorpay_subscription_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name: string
          razorpay_subscription_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          razorpay_subscription_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          ads_watched_today: number
          created_at: string
          credits: number
          credits_earned_today: number | null
          id: string
          last_ad_date: string | null
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ads_watched_today?: number
          created_at?: string
          credits?: number
          credits_earned_today?: number | null
          id?: string
          last_ad_date?: string | null
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ads_watched_today?: number
          created_at?: string
          credits?: number
          credits_earned_today?: number | null
          id?: string
          last_ad_date?: string | null
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_watch_time: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
          watch_duration_seconds: number
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
          watch_duration_seconds?: number
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
          watch_duration_seconds?: number
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed_at: string
        }
        Insert: {
          event_type: string
          id: string
          payload: Json
          processed_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      live_pulse_summary: {
        Row: {
          got_it: number | null
          lost: number | null
          session_id: string | null
          slightly_lost: number | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_pulse_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      analyze_session_results: { Args: { p_session_id: string }; Returns: Json }
      apply_redeem_code: {
        Args: { p_code_id: string; p_payment_id: string }
        Returns: Json
      }
      auto_grade_quiz_submission: {
        Args: { p_submission_id: string }
        Returns: Json
      }
      bulk_upsert_student_marks: { Args: { p_marks: Json }; Returns: Json }
      calculate_grades_batch: {
        Args: { p_class_id: string; p_grading_scale: Json }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_function_name: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_usage_limit_warning: {
        Args: {
          p_current_usage: number
          p_feature_name: string
          p_max_limit: number
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_old_webhook_events: { Args: never; Returns: number }
      close_concept_check: { Args: { p_check_id: string }; Returns: Json }
      earn_credits: {
        Args: { p_ad_duration: number; p_credits_earned: number }
        Returns: Json
      }
      earn_credits_v2: {
        Args: { p_credits_earned: number; p_session_id: string }
        Returns: Json
      }
      end_study_session: { Args: { p_session_id: string }; Returns: Json }
      generate_concept_check: {
        Args: {
          p_correct_answer: string
          p_duration_seconds?: number
          p_explanation?: string
          p_option_a: string
          p_option_b: string
          p_option_c: string
          p_option_d: string
          p_question: string
          p_session_id: string
          p_slide_context?: string
        }
        Returns: Json
      }
      generate_invite_code: { Args: never; Returns: string }
      generate_rank_list: {
        Args: { p_class_id: string; p_course_id: string }
        Returns: Json
      }
      get_active_concept_check: {
        Args: { p_session_id: string }
        Returns: Json
      }
      get_ad_stats: { Args: never; Returns: Json }
      get_assignment_results: { Args: { p_class_id: string }; Returns: Json }
      get_attendance_grid: { Args: { p_class_id: string }; Returns: Json }
      get_class_analytics: { Args: { p_class_id: string }; Returns: Json }
      get_class_report_overview: {
        Args: { p_session_id: string }
        Returns: Json
      }
      get_compliance_report_data: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      get_concept_check_results: { Args: { p_check_id: string }; Returns: Json }
      get_document_file_path: {
        Args: { p_document_id: string }
        Returns: string
      }
      get_faculty_stats: { Args: { p_institution_id: string }; Returns: Json }
      get_faculty_workload: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      get_institution_analytics: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      get_institution_billing_stats: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      get_institution_feature_access: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      get_institution_marks_summary: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      get_notes_analytics: { Args: { p_session_id: string }; Returns: Json }
      get_pulse_summary: { Args: { p_session_id: string }; Returns: Json }
      get_session_notes: {
        Args: { p_session_id: string }
        Returns: {
          ai_notes: Json
          created_at: string
          id: string
          session_id: string
          slide_context: string
          slide_index: number
          slide_title: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "session_slide_notes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_session_questions: { Args: { p_session_id: string }; Returns: Json }
      get_slide_notes: {
        Args: { p_session_id: string; p_slide_index: number }
        Returns: {
          ai_notes: Json
          created_at: string
          id: string
          session_id: string
          slide_context: string
          slide_index: number
          slide_title: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "session_slide_notes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_slide_term_definitions: {
        Args: { p_session_id: string; p_slide_index: number }
        Returns: Json
      }
      get_spotlight_sync_stats: {
        Args: { p_session_id: string }
        Returns: Json
      }
      get_student_annotations: {
        Args: { p_session_id: string }
        Returns: {
          annotations: Json
          created_at: string
          id: string
          slide_index: number
          slide_note_id: string
          student_id: string
          updated_at: string
        }[]
      }
      get_student_class_performance: {
        Args: { p_class_id: string }
        Returns: Json
      }
      get_student_progress: { Args: { p_class_id: string }; Returns: Json }
      get_student_report: { Args: { p_session_id: string }; Returns: Json }
      get_teacher_report: { Args: { p_session_id: string }; Returns: Json }
      get_user_institution_id: { Args: { uid: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_class_teacher: {
        Args: { p_class_id: string; p_teacher_id: string }
        Returns: boolean
      }
      is_enrolled_in_class: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: boolean
      }
      is_institution_admin: {
        Args: { inst_id: string; uid: string }
        Returns: boolean
      }
      is_institution_member: {
        Args: { inst_id: string; uid: string }
        Returns: boolean
      }
      join_class_by_code: { Args: { p_code: string }; Returns: Json }
      log_institution_audit: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
          p_institution_id: string
        }
        Returns: undefined
      }
      mark_auto_attendance: {
        Args: { p_class_id: string; p_session_id: string; p_student_id: string }
        Returns: undefined
      }
      record_generation: {
        Args: {
          p_metadata?: Json
          p_result_preview?: Json
          p_source_preview?: string
          p_source_type?: string
          p_title?: string
          p_tool_name: string
        }
        Returns: Json
      }
      record_video_watch_time: {
        Args: { p_duration_seconds: number; p_video_id: string }
        Returns: Json
      }
      save_report_video_results: {
        Args: { p_student_report_id: string; p_videos: Json }
        Returns: undefined
      }
      search_document_chunks: {
        Args: {
          p_document_id: string
          p_limit?: number
          p_page_filter?: number
          p_query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          heading: string
          page_number: number
          similarity: number
        }[]
      }
      set_document_file_path: {
        Args: { p_document_id: string; p_file_path: string }
        Returns: boolean
      }
      spend_credits:
        | { Args: { p_feature_name: string }; Returns: Json }
        | { Args: { p_amount: number; p_feature_name: string }; Returns: Json }
      start_study_session: { Args: { p_pdf_name: string }; Returns: Json }
      submit_anonymous_question: {
        Args: { p_content: string; p_session_id: string }
        Returns: Json
      }
      submit_concept_check_response: {
        Args: {
          p_check_id: string
          p_response_time_ms: number
          p_selected_answer: string
        }
        Returns: Json
      }
      toggle_question_upvote: { Args: { p_question_id: string }; Returns: Json }
      track_feature_usage: {
        Args: { p_feature_name: string; p_usage_minutes?: number }
        Returns: Json
      }
      trigger_report_generation: {
        Args: { p_session_id: string }
        Returns: Json
      }
      update_spotlight_session_state: {
        Args: {
          p_current_slide_content: string
          p_current_slide_title: string
          p_session_id: string
          p_spotlight_enabled: boolean
        }
        Returns: Json
      }
      upsert_pulse_response: {
        Args: { p_session_id: string; p_status: string }
        Returns: Json
      }
      upsert_student_annotations: {
        Args: { p_annotations: Json; p_slide_note_id: string }
        Returns: {
          annotations: Json
          created_at: string
          id: string
          slide_note_id: string
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "student_note_annotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_student_spotlight_state: {
        Args: {
          p_is_synced: boolean
          p_last_viewed_slide_index: number
          p_session_id: string
          p_spotlight_view_active: boolean
        }
        Returns: Json
      }
      validate_redeem_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "teacher"
        | "student"
        | "principal"
        | "dean"
        | "exam_admin"
        | "department_head"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "teacher",
        "student",
        "principal",
        "dean",
        "exam_admin",
        "department_head",
      ],
    },
  },
} as const
