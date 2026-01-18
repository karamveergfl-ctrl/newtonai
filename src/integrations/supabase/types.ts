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
      profiles: {
        Row: {
          created_at: string
          education_level: string | null
          full_name: string | null
          id: string
          language_preference: string | null
          onboarding_completed: boolean | null
          referral_source: string | null
          study_goals: string[] | null
          subjects: string[] | null
          subscription_expires_at: string | null
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          education_level?: string | null
          full_name?: string | null
          id: string
          language_preference?: string | null
          onboarding_completed?: boolean | null
          referral_source?: string | null
          study_goals?: string[] | null
          subjects?: string[] | null
          subscription_expires_at?: string | null
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          education_level?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          onboarding_completed?: boolean | null
          referral_source?: string | null
          study_goals?: string[] | null
          subjects?: string[] | null
          subscription_expires_at?: string | null
          subscription_tier?: string
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
          id?: string
          last_ad_date?: string | null
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
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
      check_rate_limit: {
        Args: {
          p_function_name: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      earn_credits: {
        Args: { p_ad_duration: number; p_credits_earned: number }
        Returns: Json
      }
      spend_credits: {
        Args: { p_amount: number; p_feature_name: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
