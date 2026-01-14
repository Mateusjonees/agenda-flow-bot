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
          whatsapp_confirmation_received: boolean | null
          whatsapp_message_id: string | null
          whatsapp_reminder_sent: boolean | null
          whatsapp_reminder_sent_at: string | null
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
          whatsapp_confirmation_received?: boolean | null
          whatsapp_message_id?: string | null
          whatsapp_reminder_sent?: boolean | null
          whatsapp_reminder_sent_at?: string | null
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
          whatsapp_confirmation_received?: boolean | null
          whatsapp_message_id?: string | null
          whatsapp_reminder_sent?: boolean | null
          whatsapp_reminder_sent_at?: string | null
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
          ai_training: Json | null
          buffer_time: number | null
          business_name: string | null
          business_type: string | null
          coupon_enabled: boolean | null
          cpf_cnpj: string | null
          created_at: string | null
          default_slot_duration: number | null
          email: string | null
          google_review_link: string | null
          id: string
          instagram_link: string | null
          is_maintenance_mode: boolean | null
          loyalty_enabled: boolean | null
          loyalty_points_per_visit: number | null
          loyalty_stamps_required: number | null
          maintenance_estimated_return: string | null
          maintenance_message: string | null
          profile_image_url: string | null
          theme_color: string | null
          updated_at: string | null
          user_id: string
          whatsapp_config: Json | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          ai_training?: Json | null
          buffer_time?: number | null
          business_name?: string | null
          business_type?: string | null
          coupon_enabled?: boolean | null
          cpf_cnpj?: string | null
          created_at?: string | null
          default_slot_duration?: number | null
          email?: string | null
          google_review_link?: string | null
          id?: string
          instagram_link?: string | null
          is_maintenance_mode?: boolean | null
          loyalty_enabled?: boolean | null
          loyalty_points_per_visit?: number | null
          loyalty_stamps_required?: number | null
          maintenance_estimated_return?: string | null
          maintenance_message?: string | null
          profile_image_url?: string | null
          theme_color?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_config?: Json | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          ai_training?: Json | null
          buffer_time?: number | null
          business_name?: string | null
          business_type?: string | null
          coupon_enabled?: boolean | null
          cpf_cnpj?: string | null
          created_at?: string | null
          default_slot_duration?: number | null
          email?: string | null
          google_review_link?: string | null
          id?: string
          instagram_link?: string | null
          is_maintenance_mode?: boolean | null
          loyalty_enabled?: boolean | null
          loyalty_points_per_visit?: number | null
          loyalty_stamps_required?: number | null
          maintenance_estimated_return?: string | null
          maintenance_message?: string | null
          profile_image_url?: string | null
          theme_color?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_config?: Json | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string | null
          id: string
          product_id: string
          product_snapshot: Json | null
          quantity: number
          subtotal: number
          unit_price: number
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string | null
          id?: string
          product_id: string
          product_snapshot?: Json | null
          quantity?: number
          subtotal: number
          unit_price: number
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          product_snapshot?: Json | null
          quantity?: number
          subtotal?: number
          unit_price?: number
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
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
          last_whatsapp_interaction: string | null
          last_whatsapp_message: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp_active: boolean | null
          whatsapp_name: string | null
          whatsapp_number: string | null
          whatsapp_opt_in: boolean | null
          whatsapp_phone: string | null
          whatsapp_verified: boolean | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_whatsapp_interaction?: string | null
          last_whatsapp_message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_active?: boolean | null
          whatsapp_name?: string | null
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean | null
          whatsapp_phone?: string | null
          whatsapp_verified?: boolean | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_whatsapp_interaction?: string | null
          last_whatsapp_message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_active?: boolean | null
          whatsapp_name?: string | null
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean | null
          whatsapp_phone?: string | null
          whatsapp_verified?: boolean | null
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
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
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
      order_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_deducted: boolean | null
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          subtotal: number
          unit_price: number
          variant_attributes: Json | null
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_deducted?: boolean | null
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          subtotal: number
          unit_price: number
          variant_attributes?: Json | null
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_deducted?: boolean | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
          variant_attributes?: Json | null
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by_user_id: string | null
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Insert: {
          changed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Update: {
          changed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cart_id: string | null
          conversation_id: string | null
          coupon_code: string | null
          coupon_discount: number | null
          coupon_id: string | null
          created_at: string | null
          customer_id: string
          customer_notes: string | null
          delivered_at: string | null
          discount: number | null
          estimated_delivery_date: string | null
          id: string
          internal_notes: string | null
          invoice_url: string | null
          order_number: string
          payment_confirmed_at: string | null
          payment_method: string | null
          pix_charge_id: string | null
          refund_amount: number | null
          refunded_at: string | null
          shipping_address: Json
          shipping_cost: number | null
          shipping_method: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          tracking_code: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cart_id?: string | null
          conversation_id?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          customer_id: string
          customer_notes?: string | null
          delivered_at?: string | null
          discount?: number | null
          estimated_delivery_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_url?: string | null
          order_number: string
          payment_confirmed_at?: string | null
          payment_method?: string | null
          pix_charge_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          shipping_address: Json
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          tracking_code?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cart_id?: string | null
          conversation_id?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          customer_id?: string
          customer_notes?: string | null
          delivered_at?: string | null
          discount?: number | null
          estimated_delivery_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_url?: string | null
          order_number?: string
          payment_confirmed_at?: string | null
          payment_method?: string | null
          pix_charge_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          shipping_address?: Json
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pix_charge_id_fkey"
            columns: ["pix_charge_id"]
            isOneToOne: false
            referencedRelation: "pix_charges"
            referencedColumns: ["id"]
          },
        ]
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
          processed_at: string | null
          processed_for: string | null
          qr_code: string
          qr_code_url: string | null
          reminders_sent: number | null
          status: string | null
          subscription_id: string | null
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
          processed_at?: string | null
          processed_for?: string | null
          qr_code: string
          qr_code_url?: string | null
          reminders_sent?: number | null
          status?: string | null
          subscription_id?: string | null
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
          processed_at?: string | null
          processed_for?: string | null
          qr_code?: string
          qr_code_url?: string | null
          reminders_sent?: number | null
          status?: string | null
          subscription_id?: string | null
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
          {
            foreignKeyName: "pix_charges_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_primary: boolean | null
          product_id: string
          url: string
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          product_id: string
          url: string
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          product_id?: string
          url?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_inventory_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          product_id: string
          quantity_needed: number | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          product_id: string
          quantity_needed?: number | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          product_id?: string
          quantity_needed?: number | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json | null
          compare_at_price: number | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          product_id: string
          sku: string
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          compare_at_price?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          product_id: string
          sku: string
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          compare_at_price?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          product_id?: string
          sku?: string
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorder: boolean | null
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          height_cm: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          length_cm: number | null
          low_stock_threshold: number | null
          max_quantity_per_order: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          price: number
          requires_shipping: boolean | null
          short_description: string | null
          sku: string | null
          stock_quantity: number | null
          tags: string[] | null
          track_inventory: boolean | null
          updated_at: string | null
          user_id: string
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          allow_backorder?: boolean | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          length_cm?: number | null
          low_stock_threshold?: number | null
          max_quantity_per_order?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price?: number
          requires_shipping?: boolean | null
          short_description?: string | null
          sku?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string | null
          user_id: string
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          allow_backorder?: boolean | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          length_cm?: number | null
          low_stock_threshold?: number | null
          max_quantity_per_order?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          requires_shipping?: boolean | null
          short_description?: string | null
          sku?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string | null
          user_id?: string
          weight_grams?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
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
      service_packages: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number
          final_price: number
          id: string
          is_active: boolean
          name: string
          service_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number
          final_price: number
          id?: string
          is_active?: boolean
          name: string
          service_ids: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number
          final_price?: number
          id?: string
          is_active?: boolean
          name?: string
          service_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_price_history: {
        Row: {
          changed_at: string
          id: string
          new_price: number
          old_price: number | null
          service_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_price: number
          old_price?: number | null
          service_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_price?: number
          old_price?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_price_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
      shipping_addresses: {
        Row: {
          city: string
          complement: string | null
          country: string | null
          created_at: string | null
          customer_id: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          label: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string
          number: string
          postal_code: string
          recipient_name: string
          recipient_phone: string | null
          reference: string | null
          state: string
          street: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city: string
          complement?: string | null
          country?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood: string
          number: string
          postal_code: string
          recipient_name: string
          recipient_phone?: string | null
          reference?: string | null
          state: string
          street: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string
          complement?: string | null
          country?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string
          number?: string
          postal_code?: string
          recipient_name?: string
          recipient_phone?: string | null
          reference?: string | null
          state?: string
          street?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_carts: {
        Row: {
          conversation_id: string | null
          converted_to_order_id: string | null
          coupon_discount: number | null
          coupon_id: string | null
          created_at: string | null
          customer_id: string | null
          discount: number | null
          expires_at: string | null
          id: string
          shipping_cost: number | null
          status: Database["public"]["Enums"]["cart_status"] | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          converted_to_order_id?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          expires_at?: string | null
          id?: string
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["cart_status"] | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          converted_to_order_id?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          expires_at?: string | null
          id?: string
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["cart_status"] | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_carts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_carts_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_carts_order_fkey"
            columns: ["converted_to_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          billing_frequency: string | null
          created_at: string | null
          customer_id: string | null
          failed_payments_count: number | null
          id: string
          last_billing_date: string | null
          last_payment_attempt: string | null
          next_billing_date: string | null
          payment_method: string | null
          plan_id: string | null
          plan_name: string | null
          start_date: string | null
          status: string | null
          subscription_type: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_frequency?: string | null
          created_at?: string | null
          customer_id?: string | null
          failed_payments_count?: number | null
          id?: string
          last_billing_date?: string | null
          last_payment_attempt?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id?: string | null
          plan_name?: string | null
          start_date?: string | null
          status?: string | null
          subscription_type?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_frequency?: string | null
          created_at?: string | null
          customer_id?: string | null
          failed_payments_count?: number | null
          id?: string
          last_billing_date?: string | null
          last_payment_attempt?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id?: string | null
          plan_name?: string | null
          start_date?: string | null
          status?: string | null
          subscription_type?: string | null
          type?: string | null
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
      subtasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          status: string | null
          task_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string | null
          task_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string | null
          task_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          color: string | null
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
          color?: string | null
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
          color?: string | null
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
      testimonials: {
        Row: {
          business_name: string
          business_type: string
          content: string
          created_at: string
          highlight: string | null
          id: string
          is_approved: boolean
          is_featured: boolean
          is_hidden: boolean | null
          name: string
          photo_url: string | null
          rating: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_name: string
          business_type?: string
          content: string
          created_at?: string
          highlight?: string | null
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          is_hidden?: boolean | null
          name: string
          photo_url?: string | null
          rating?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_name?: string
          business_type?: string
          content?: string
          created_at?: string
          highlight?: string | null
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          is_hidden?: boolean | null
          name?: string
          photo_url?: string | null
          rating?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_paid: boolean | null
          last_payment_at: string | null
          next_payment_due: string | null
          role: Database["public"]["Enums"]["app_role"]
          seat_payment_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_paid?: boolean | null
          last_payment_at?: string | null
          next_payment_due?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          seat_payment_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_paid?: boolean | null
          last_payment_at?: string | null
          next_payment_due?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          seat_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_seat_payment_id_fkey"
            columns: ["seat_payment_id"]
            isOneToOne: false
            referencedRelation: "user_seat_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_seat_payments: {
        Row: {
          amount: number | null
          checkout_url: string | null
          created_at: string | null
          created_user_id: string | null
          expires_at: string | null
          id: string
          mp_payment_id: string | null
          owner_user_id: string
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          pending_email: string
          pending_name: string
          pending_password: string
          pending_role: string
          qr_code: string | null
          qr_code_base64: string | null
          status: string | null
          ticket_url: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          checkout_url?: string | null
          created_at?: string | null
          created_user_id?: string | null
          expires_at?: string | null
          id?: string
          mp_payment_id?: string | null
          owner_user_id: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          pending_email: string
          pending_name: string
          pending_password: string
          pending_role?: string
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string | null
          ticket_url?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          checkout_url?: string | null
          created_at?: string | null
          created_user_id?: string | null
          expires_at?: string | null
          id?: string
          mp_payment_id?: string | null
          owner_user_id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          pending_email?: string
          pending_name?: string
          pending_password?: string
          pending_role?: string
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string | null
          ticket_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          assigned_to_human: boolean | null
          assigned_to_user_id: string | null
          closed_at: string | null
          context: Json | null
          created_at: string | null
          customer_id: string | null
          id: string
          last_intent: string | null
          last_message_at: string | null
          message_count: number | null
          response_time_avg_seconds: number | null
          started_at: string | null
          status:
            | Database["public"]["Enums"]["whatsapp_conversation_status"]
            | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          whatsapp_name: string | null
          whatsapp_phone: string
        }
        Insert: {
          assigned_to_human?: boolean | null
          assigned_to_user_id?: string | null
          closed_at?: string | null
          context?: Json | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          last_intent?: string | null
          last_message_at?: string | null
          message_count?: number | null
          response_time_avg_seconds?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["whatsapp_conversation_status"]
            | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          whatsapp_name?: string | null
          whatsapp_phone: string
        }
        Update: {
          assigned_to_human?: boolean | null
          assigned_to_user_id?: string | null
          closed_at?: string | null
          context?: Json | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          last_intent?: string | null
          last_message_at?: string | null
          message_count?: number | null
          response_time_avg_seconds?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["whatsapp_conversation_status"]
            | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          whatsapp_name?: string | null
          whatsapp_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          ai_processed: boolean | null
          ai_response: Json | null
          content: string | null
          conversation_id: string
          created_at: string | null
          delivered_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          error_message: string | null
          id: string
          media_mime_type: string | null
          media_url: string | null
          message_type: Database["public"]["Enums"]["whatsapp_message_type"]
          metadata: Json | null
          read_at: string | null
          sent_at: string | null
          status: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          ai_processed?: boolean | null
          ai_response?: Json | null
          content?: string | null
          conversation_id: string
          created_at?: string | null
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          error_message?: string | null
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          message_type: Database["public"]["Enums"]["whatsapp_message_type"]
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          ai_processed?: boolean | null
          ai_response?: Json | null
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          error_message?: string | null
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["whatsapp_message_type"]
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body_text: string
          buttons: Json | null
          created_at: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          last_used_at: string | null
          rejection_reason: string | null
          status: string | null
          template_category: string | null
          template_language: string | null
          template_name: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
          variables: Json | null
        }
        Insert: {
          body_text: string
          buttons?: Json | null
          created_at?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          last_used_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          template_category?: string | null
          template_language?: string | null
          template_name: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
          variables?: Json | null
        }
        Update: {
          body_text?: string
          buttons?: Json | null
          created_at?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          last_used_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          template_category?: string | null
          template_language?: string | null
          template_name?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_product_stock: {
        Args: { product_id: string; quantity: number }
        Returns: undefined
      }
      decrement_variant_stock: {
        Args: { quantity: number; variant_id: string }
        Returns: undefined
      }
      generate_order_number: { Args: never; Returns: string }
      get_owner_user_id: { Args: { _user_id: string }; Returns: string }
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
      app_role:
        | "owner"
        | "admin"
        | "employee"
        | "viewer"
        | "seller"
        | "financial"
      cart_status: "active" | "abandoned" | "converted"
      ChamaaiStatus: "opened" | "closed" | "paused"
      DeviceMessage: "ios" | "android" | "web" | "unknown" | "desktop"
      Events:
        | "APPLICATION_STARTUP"
        | "QRCODE_UPDATED"
        | "MESSAGES_SET"
        | "MESSAGES_UPSERT"
        | "MESSAGES_UPDATE"
        | "MESSAGES_DELETE"
        | "SEND_MESSAGE"
        | "CONTACTS_SET"
        | "CONTACTS_UPSERT"
        | "CONTACTS_UPDATE"
        | "PRESENCE_UPDATE"
        | "CHATS_SET"
        | "CHATS_UPSERT"
        | "CHATS_UPDATE"
        | "CHATS_DELETE"
        | "GROUPS_UPSERT"
        | "GROUP_UPDATE"
        | "GROUP_PARTICIPANTS_UPDATE"
        | "CONNECTION_UPDATE"
        | "LABELS_EDIT"
        | "LABELS_ASSOCIATION"
        | "CALL"
        | "NEW_JWT_TOKEN"
        | "TYPEBOT_START"
        | "TYPEBOT_CHANGE_STATUS"
        | "CHAMA_AI_ACTION"
        | "ERRORS"
        | "ERRORS_WEBHOOK"
      InstanceConnectionStatus: "open" | "close" | "connecting"
      IntegrationStatus: "opened" | "closed" | "paused"
      message_direction: "inbound" | "outbound"
      order_status:
        | "draft"
        | "pending_payment"
        | "payment_confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      TypebotStatus: "opened" | "closed" | "paused"
      wa_PresenceStatus:
        | "unavailable"
        | "available"
        | "composing"
        | "recording"
        | "paused"
      whatsapp_conversation_status:
        | "active"
        | "waiting_response"
        | "waiting_human"
        | "resolved"
        | "abandoned"
      whatsapp_message_type:
        | "text"
        | "image"
        | "video"
        | "document"
        | "audio"
        | "location"
        | "contacts"
        | "interactive_button"
        | "interactive_list"
        | "template"
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
      app_role: ["owner", "admin", "employee", "viewer", "seller", "financial"],
      cart_status: ["active", "abandoned", "converted"],
      ChamaaiStatus: ["opened", "closed", "paused"],
      DeviceMessage: ["ios", "android", "web", "unknown", "desktop"],
      Events: [
        "APPLICATION_STARTUP",
        "QRCODE_UPDATED",
        "MESSAGES_SET",
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "MESSAGES_DELETE",
        "SEND_MESSAGE",
        "CONTACTS_SET",
        "CONTACTS_UPSERT",
        "CONTACTS_UPDATE",
        "PRESENCE_UPDATE",
        "CHATS_SET",
        "CHATS_UPSERT",
        "CHATS_UPDATE",
        "CHATS_DELETE",
        "GROUPS_UPSERT",
        "GROUP_UPDATE",
        "GROUP_PARTICIPANTS_UPDATE",
        "CONNECTION_UPDATE",
        "LABELS_EDIT",
        "LABELS_ASSOCIATION",
        "CALL",
        "NEW_JWT_TOKEN",
        "TYPEBOT_START",
        "TYPEBOT_CHANGE_STATUS",
        "CHAMA_AI_ACTION",
        "ERRORS",
        "ERRORS_WEBHOOK",
      ],
      InstanceConnectionStatus: ["open", "close", "connecting"],
      IntegrationStatus: ["opened", "closed", "paused"],
      message_direction: ["inbound", "outbound"],
      order_status: [
        "draft",
        "pending_payment",
        "payment_confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      TypebotStatus: ["opened", "closed", "paused"],
      wa_PresenceStatus: [
        "unavailable",
        "available",
        "composing",
        "recording",
        "paused",
      ],
      whatsapp_conversation_status: [
        "active",
        "waiting_response",
        "waiting_human",
        "resolved",
        "abandoned",
      ],
      whatsapp_message_type: [
        "text",
        "image",
        "video",
        "document",
        "audio",
        "location",
        "contacts",
        "interactive_button",
        "interactive_list",
        "template",
      ],
    },
  },
} as const
