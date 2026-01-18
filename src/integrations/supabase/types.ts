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
      application_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          placeholders: Json | null
          template_content: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          placeholders?: Json | null
          template_content: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          placeholders?: Json | null
          template_content?: string
          updated_at?: string
        }
        Relationships: []
      }
      application_usages: {
        Row: {
          created_at: string
          generated_content: string | null
          id: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_content?: string | null
          id?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          generated_content?: string | null
          id?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_usages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "application_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_reminders: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          is_notified: boolean | null
          remind_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          is_notified?: boolean | null
          remind_at: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          is_notified?: boolean | null
          remind_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_reminders_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string
          description: string | null
          due_date: string
          id: string
          status: string
          subject: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          status?: string
          subject: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          status?: string
          subject?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          chapter: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string | null
          file_url: string
          id: string
          is_premium: boolean | null
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          chapter?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          is_premium?: boolean | null
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          chapter?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          is_premium?: boolean | null
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          max_assignments: number | null
          monthly_applications: number | null
          name: string
          price: number | null
          type: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          max_assignments?: number | null
          monthly_applications?: number | null
          name: string
          price?: number | null
          type: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          max_assignments?: number | null
          monthly_applications?: number | null
          name?: string
          price?: number | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college: string | null
          course: string | null
          created_at: string
          email: string
          id: string
          name: string
          semester: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          college?: string | null
          course?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          semester?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          college?: string | null
          course?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          semester?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pyqs: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string | null
          file_url: string
          id: string
          is_frequently_repeated: boolean | null
          is_important: boolean | null
          is_premium: boolean | null
          subject_id: string | null
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          is_frequently_repeated?: boolean | null
          is_important?: boolean | null
          is_premium?: boolean | null
          subject_id?: string | null
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          is_frequently_repeated?: boolean | null
          is_important?: boolean | null
          is_premium?: boolean | null
          subject_id?: string | null
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "pyqs_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          semester: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          semester?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          semester?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          plan_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_assignment_count: { Args: { _user_id: string }; Returns: number }
      get_monthly_application_count: {
        Args: { _user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_premium_subscriber: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "admin"
      subscription_status: "active" | "expired" | "cancelled"
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
      app_role: ["student", "admin"],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
