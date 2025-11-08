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
          created_at: string | null
          customer_id: string | null
          description: string | null
          end_time: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          price: number | null
          proposal_id: string | null
          service_id: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          end_time: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price?: number | null
          proposal_id?: string | null
          service_id?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price?: number | null
          proposal_id?: string | null
          service_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          address: string | null
          business_name: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          is_maintenance_mode: boolean | null
          maintenance_estimated_return: string | null
          maintenance_message: string | null
          profile_image_url: string | null
          theme_color: string | null
          updated_at: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_maintenance_mode?: boolean | null
          maintenance_estimated_return?: string | null
          maintenance_message?: string | null
          profile_image_url?: string | null
          theme_color?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_maintenance_mode?: boolean | null
          maintenance_estimated_return?: string | null
          maintenance_message?: string | null
          profile_image_url?: string | null
          theme_color?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      cash_flow_projections: {
        Row: {
          confirmed_expenses: number | null
          confirmed_income: number | null
          created_at: string | null
          date: string
          expected_expenses: number | null
          expected_income: number | null
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confirmed_expenses?: number | null
          confirmed_income?: number | null
          created_at?: string | null
          date: string
          expected_expenses?: number | null
          expected_income?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confirmed_expenses?: number | null
          confirmed_income?: number | null
          created_at?: string | null
          date?: string
          expected_expenses?: number | null
          expected_income?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          discount_percentage: number | null
          discount_type: string | null
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          status: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          discount_type?: string | null
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          status?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          discount_type?: string | null
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          status?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          created_at: string | null
          customer_id: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      document_history: {
        Row: {
          created_at: string
          document_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string | null
          recipient_name: string
          related_id: string
          related_type: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name: string
          related_id: string
          related_type: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name?: string
          related_id?: string
          related_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          status: string | null
          transaction_date: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          transaction_date?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          transaction_date?: string | null
          type?: string
          user_id?: string | null
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
      inventory_items: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string | null
          current_stock: number | null
          description: string | null
          id: string
          min_quantity: number | null
          name: string
          quantity: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          min_quantity?: number | null
          name: string
          quantity?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          min_quantity?: number | null
          name?: string
          quantity?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      loyalty_cards: {
        Row: {
          created_at: string | null
          current_stamps: number | null
          customer_id: string | null
          id: string
          last_visit_at: string | null
          points: number | null
          rewards_redeemed: number | null
          stamps_required: number | null
          total_points: number | null
          total_visits: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_stamps?: number | null
          customer_id?: string | null
          id?: string
          last_visit_at?: string | null
          points?: number | null
          rewards_redeemed?: number | null
          stamps_required?: number | null
          total_points?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_stamps?: number | null
          customer_id?: string | null
          id?: string
          last_visit_at?: string | null
          points?: number | null
          rewards_redeemed?: number | null
          stamps_required?: number | null
          total_points?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_views: {
        Row: {
          id: string
          notification_id: string
          notification_type: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          notification_id: string
          notification_type: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          notification_id?: string
          notification_type?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      pix_charges: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          customer_name: string
          customer_phone: string | null
          description: string | null
          expires_at: string
          id: string
          last_reminder_at: string | null
          metadata: Json | null
          paid_at: string | null
          qr_code: string
          qr_code_url: string | null
          reminders_sent: number | null
          status: string | null
          txid: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          customer_name: string
          customer_phone?: string | null
          description?: string | null
          expires_at: string
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          paid_at?: string | null
          qr_code: string
          qr_code_url?: string | null
          reminders_sent?: number | null
          status?: string | null
          txid: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          customer_name?: string
          customer_phone?: string | null
          description?: string | null
          expires_at?: string
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          paid_at?: string | null
          qr_code?: string
          qr_code_url?: string | null
          reminders_sent?: number | null
          status?: string | null
          txid?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pix_charges_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          discount: number | null
          final_amount: number | null
          id: string
          items: Json | null
          status: string | null
          title: string
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          discount?: number | null
          final_amount?: number | null
          id?: string
          items?: Json | null
          status?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          discount?: number | null
          final_amount?: number | null
          id?: string
          items?: Json | null
          status?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string | null
          customer_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          rating?: number
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
      services: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          item_id: string | null
          new_stock: number
          previous_stock: number
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          new_stock: number
          previous_stock: number
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          new_stock?: number
          previous_stock?: number
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_frequency: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          services: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_frequency?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          services?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_frequency?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          services?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          customer_id: string | null
          failed_payments_count: number | null
          id: string
          last_billing_date: string | null
          last_payment_attempt: string | null
          next_billing_date: string | null
          plan_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          failed_payments_count?: number | null
          id?: string
          last_billing_date?: string | null
          last_payment_attempt?: string | null
          next_billing_date?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          failed_payments_count?: number | null
          id?: string
          last_billing_date?: string | null
          last_payment_attempt?: string | null
          next_billing_date?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      update_inventory_stock: {
        Args: {
          p_item_id: string
          p_quantity: number
          p_reason?: string
          p_reference_id?: string
          p_reference_type?: string
          p_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "employee" | "viewer"
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
      app_role: ["owner", "admin", "employee", "viewer"],
    },
  },
} as const
