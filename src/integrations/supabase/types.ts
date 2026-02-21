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
          assignment_id: string
          graded_at: string | null
          id: string
          score: number | null
          status: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          answers?: Json
          assignment_id: string
          graded_at?: string | null
          id?: string
          score?: number | null
          status?: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          answers?: Json
          assignment_id?: string
          graded_at?: string | null
          id?: string
          score?: number | null
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
          created_at: string
          description: string | null
          id: string
          invite_code: string
          is_active: boolean
          name: string
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          is_active?: boolean
          name: string
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          is_active?: boolean
          name?: string
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      apply_redeem_code: {
        Args: { p_code_id: string; p_payment_id: string }
        Returns: Json
      }
      auto_grade_quiz_submission: {
        Args: { p_submission_id: string }
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
      earn_credits: {
        Args: { p_ad_duration: number; p_credits_earned: number }
        Returns: Json
      }
      earn_credits_v2: {
        Args: { p_credits_earned: number; p_session_id: string }
        Returns: Json
      }
      end_study_session: { Args: { p_session_id: string }; Returns: Json }
      generate_invite_code: { Args: never; Returns: string }
      get_ad_stats: { Args: never; Returns: Json }
      get_assignment_results: { Args: { p_class_id: string }; Returns: Json }
      get_attendance_grid: { Args: { p_class_id: string }; Returns: Json }
      get_class_analytics: { Args: { p_class_id: string }; Returns: Json }
      get_document_file_path: {
        Args: { p_document_id: string }
        Returns: string
      }
      get_student_progress: { Args: { p_class_id: string }; Returns: Json }
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
      join_class_by_code: { Args: { p_code: string }; Returns: Json }
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
      track_feature_usage: {
        Args: { p_feature_name: string; p_usage_minutes?: number }
        Returns: Json
      }
      validate_redeem_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "teacher" | "student"
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
      app_role: ["admin", "moderator", "user", "teacher", "student"],
    },
  },
} as const
