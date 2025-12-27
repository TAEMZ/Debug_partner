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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string | null
          id: string
          problem_id: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          problem_id?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          problem_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          comments: boolean | null
          created_at: string | null
          id: string
          new_insights: boolean | null
          shares: boolean | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          comments?: boolean | null
          created_at?: string | null
          id?: string
          new_insights?: boolean | null
          shares?: boolean | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          comments?: boolean | null
          created_at?: string | null
          id?: string
          new_insights?: boolean | null
          shares?: boolean | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      insight_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          insight_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          insight_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          insight_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_comments_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "insights"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          code_samples: Json | null
          content: string
          created_at: string
          id: string
          insight_type: string
          is_significant: boolean | null
          problem_id: string
          session_id: string
        }
        Insert: {
          code_samples?: Json | null
          content: string
          created_at?: string
          id?: string
          insight_type: string
          is_significant?: boolean | null
          problem_id: string
          session_id: string
        }
        Update: {
          code_samples?: Json | null
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          is_significant?: boolean | null
          problem_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "reasoning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          enabled: boolean | null
          max_notifications_per_day: number | null
          schedule_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          max_notifications_per_day?: number | null
          schedule_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          max_notifications_per_day?: number | null
          schedule_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      problem_files: {
        Row: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          problem_id: string
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          problem_id: string
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_files_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_shares: {
        Row: {
          accepted: boolean | null
          access_level: string | null
          created_at: string | null
          id: string
          problem_id: string
          shared_by: string
          shared_with_email: string
        }
        Insert: {
          accepted?: boolean | null
          access_level?: string | null
          created_at?: string | null
          id?: string
          problem_id: string
          shared_by: string
          shared_with_email: string
        }
        Update: {
          accepted?: boolean | null
          access_level?: string | null
          created_at?: string | null
          id?: string
          problem_id?: string
          shared_by?: string
          shared_with_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_shares_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          ai_cost: number | null
          archived: boolean | null
          category: Database["public"]["Enums"]["problem_category"] | null
          created_at: string
          description: string
          environment_info: Json | null
          framework: Database["public"]["Enums"]["framework_type"] | null
          id: string
          language: Database["public"]["Enums"]["programming_language"] | null
          max_budget: number | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["problem_severity"] | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_cost?: number | null
          archived?: boolean | null
          category?: Database["public"]["Enums"]["problem_category"] | null
          created_at?: string
          description: string
          environment_info?: Json | null
          framework?: Database["public"]["Enums"]["framework_type"] | null
          id?: string
          language?: Database["public"]["Enums"]["programming_language"] | null
          max_budget?: number | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["problem_severity"] | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_cost?: number | null
          archived?: boolean | null
          category?: Database["public"]["Enums"]["problem_category"] | null
          created_at?: string
          description?: string
          environment_info?: Json | null
          framework?: Database["public"]["Enums"]["framework_type"] | null
          id?: string
          language?: Database["public"]["Enums"]["programming_language"] | null
          max_budget?: number | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["problem_severity"] | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reasoning_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          layer_name: string
          layer_order: number
          problem_id: string
          schedule_time: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          layer_name: string
          layer_order: number
          problem_id: string
          schedule_time: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          layer_name?: string
          layer_order?: number
          problem_id?: string
          schedule_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reasoning_sessions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_can_view_problem: {
        Args: { _problem_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      framework_type:
        | "react"
        | "vue"
        | "angular"
        | "svelte"
        | "nextjs"
        | "express"
        | "django"
        | "flask"
        | "spring"
        | "laravel"
        | "rails"
        | "other"
      problem_category:
        | "bug"
        | "performance"
        | "api"
        | "ui"
        | "database"
        | "security"
        | "other"
      problem_severity: "low" | "medium" | "high" | "critical"
      programming_language:
        | "javascript"
        | "typescript"
        | "python"
        | "java"
        | "csharp"
        | "ruby"
        | "go"
        | "rust"
        | "php"
        | "swift"
        | "kotlin"
        | "other"
      workspace_role: "owner" | "admin" | "member" | "viewer"
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
      framework_type: [
        "react",
        "vue",
        "angular",
        "svelte",
        "nextjs",
        "express",
        "django",
        "flask",
        "spring",
        "laravel",
        "rails",
        "other",
      ],
      problem_category: [
        "bug",
        "performance",
        "api",
        "ui",
        "database",
        "security",
        "other",
      ],
      problem_severity: ["low", "medium", "high", "critical"],
      programming_language: [
        "javascript",
        "typescript",
        "python",
        "java",
        "csharp",
        "ruby",
        "go",
        "rust",
        "php",
        "swift",
        "kotlin",
        "other",
      ],
      workspace_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
