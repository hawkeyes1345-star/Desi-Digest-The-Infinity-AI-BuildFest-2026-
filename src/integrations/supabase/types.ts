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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          nanumoni_friendly_note: string | null
          category: string
          common_combinations: string | null
          created_at: string
          embedding: string | null
          embedding_source: string | null
          food_id: string
          health_tags: string[]
          id: string
          name_bn: string
          name_en: string
          nutrition_per_portion: Json
          typical_portion_grams: number
          updated_at: string
          visual_description: string
        }
        Insert: {
          nanumoni_friendly_note?: string | null
          category: string
          common_combinations?: string | null
          created_at?: string
          embedding?: string | null
          embedding_source?: string | null
          food_id: string
          health_tags?: string[]
          id?: string
          name_bn: string
          name_en: string
          nutrition_per_portion?: Json
          typical_portion_grams: number
          updated_at?: string
          visual_description: string
        }
        Update: {
          nanumoni_friendly_note?: string | null
          category?: string
          common_combinations?: string | null
          created_at?: string
          embedding?: string | null
          embedding_source?: string | null
          food_id?: string
          health_tags?: string[]
          id?: string
          name_bn?: string
          name_en?: string
          nutrition_per_portion?: Json
          typical_portion_grams?: number
          updated_at?: string
          visual_description?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          analysis: Json | null
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          fiber_g: number
          health_score: number | null
          id: string
          image_url: string | null
          logged_at: string
          meal_type: string
          name: string
          notes: string | null
          protein_g: number
          sodium_mg: number
          source: string
          sugar_g: number
          user_id: string
          water_ml: number
        }
        Insert: {
          analysis?: Json | null
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          health_score?: number | null
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_type: string
          name: string
          notes?: string | null
          protein_g?: number
          sodium_mg?: number
          source?: string
          sugar_g?: number
          user_id: string
          water_ml?: number
        }
        Update: {
          analysis?: Json | null
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          health_score?: number | null
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_type?: string
          name?: string
          notes?: string | null
          protein_g?: number
          sodium_mg?: number
          source?: string
          sugar_g?: number
          user_id?: string
          water_ml?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[]
          alternative_mode: boolean
          budget_bdt: number | null
          budget_period: string | null
          created_at: string
          dietary_preference: string | null
          display_name: string | null
          full_name: string | null
          goals: string[]
          health_conditions: string[]
          height_cm: number | null
          location: string | null
          notes: string | null
          onboarded_at: string | null
          sex: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          alternative_mode?: boolean
          budget_bdt?: number | null
          budget_period?: string | null
          created_at?: string
          dietary_preference?: string | null
          display_name?: string | null
          full_name?: string | null
          goals?: string[]
          health_conditions?: string[]
          height_cm?: number | null
          location?: string | null
          notes?: string | null
          onboarded_at?: string | null
          sex?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          alternative_mode?: boolean
          budget_bdt?: number | null
          budget_period?: string | null
          created_at?: string
          dietary_preference?: string | null
          display_name?: string | null
          full_name?: string | null
          goals?: string[]
          health_conditions?: string[]
          height_cm?: number | null
          location?: string | null
          notes?: string | null
          onboarded_at?: string | null
          sex?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_foods: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          nanumoni_friendly_note: string
          category: string
          common_combinations: string
          food_id: string
          health_tags: string[]
          name_bn: string
          name_en: string
          nutrition_per_portion: Json
          similarity: number
          typical_portion_grams: number
          visual_description: string
        }[]
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
