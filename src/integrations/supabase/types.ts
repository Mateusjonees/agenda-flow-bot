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
      appointments: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          end_time: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          price: number | null
          start_time: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          end_time: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price?: number | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price?: number | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          created_at: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          address: string | null
          allow_overbooking: boolean | null
          buffer_time: number | null
          business_name: string
          business_type: string | null
          created_at: string
          id: string
          phone: string | null
          slot_duration: number | null
          updated_at: string
          user_id: string
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          allow_overbooking?: boolean | null
          buffer_time?: number | null
          business_name: string
          business_type?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          slot_duration?: number | null
          updated_at?: string
          user_id: string
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          allow_overbooking?: boolean | null
          buffer_time?: number | null
          business_name?: string
          business_type?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          slot_duration?: number | null
          updated_at?: string
          user_id?: string
          working_hours?: Json | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          appointment_id: string | null
          code: string
          created_at: string
          customer_id: string
          discount_amount: number | null
          discount_percentage: number | null
          expires_at: string
          id: string
          is_active: boolean
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          code: string
          created_at?: string
          customer_id: string
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at: string
          id?: string
          is_active?: boolean
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          code?: string
          created_at?: string
          customer_id?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          payment_method: string | null
          status: string
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_date?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_cards: {
        Row: {
          created_at: string
          current_stamps: number
          customer_id: string
          id: string
          last_visit_at: string | null
          rewards_redeemed: number
          stamps_required: number
          total_visits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_stamps?: number
          customer_id: string
          id?: string
          last_visit_at?: string | null
          rewards_redeemed?: number
          stamps_required?: number
          total_visits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_stamps?: number
          customer_id?: string
          id?: string
          last_visit_at?: string | null
          rewards_redeemed?: number
          stamps_required?: number
          total_visits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_stamps: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          loyalty_card_id: string
          stamps_added: number
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          loyalty_card_id: string
          stamps_added?: number
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          loyalty_card_id?: string
          stamps_added?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_stamps_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_stamps_loyalty_card_id_fkey"
            columns: ["loyalty_card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_charges: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          expires_at: string | null
          id: string
          last_reminder_at: string | null
          metadata: Json | null
          paid_at: string | null
          pix_key: string | null
          qr_code: string | null
          qr_code_image: string | null
          reminders_sent: number | null
          status: string
          transaction_id: string | null
          txid: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          paid_at?: string | null
          pix_key?: string | null
          qr_code?: string | null
          qr_code_image?: string | null
          reminders_sent?: number | null
          status?: string
          transaction_id?: string | null
          txid?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          paid_at?: string | null
          pix_key?: string | null
          qr_code?: string | null
          qr_code_image?: string | null
          reminders_sent?: number | null
          status?: string
          transaction_id?: string | null
          txid?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_charges_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_charges_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
