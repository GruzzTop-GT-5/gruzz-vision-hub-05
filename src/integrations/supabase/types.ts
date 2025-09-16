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
      admin_logs: {
        Row: {
          action: string
          id: string
          target_id: string | null
          target_type: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          target_id?: string | null
          target_type?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          category: string
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          price: number
          status: Database["public"]["Enums"]["ad_status"] | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          price: number
          status?: Database["public"]["Enums"]["ad_status"] | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          price?: number
          status?: Database["public"]["Enums"]["ad_status"] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          created_by: string
          id: string
          last_message_at: string | null
          participants: string[]
          priority: string | null
          status: string | null
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          last_message_at?: string | null
          participants: string[]
          priority?: string | null
          status?: string | null
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          last_message_at?: string | null
          participants?: string[]
          priority?: string | null
          status?: string | null
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          message_type: string | null
          metadata: Json | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_files: {
        Row: {
          created_at: string
          description: string | null
          file_category: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          order_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_category?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          order_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_category?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          order_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_public: boolean | null
          order_id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          order_id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          order_id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          metadata: Json | null
          order_id: string
          reason: string | null
          status_from: string | null
          status_to: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id: string
          reason?: string | null
          status_from?: string | null
          status_to: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          reason?: string | null
          status_from?: string | null
          status_to?: string
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
          ad_id: string | null
          cancelled_at: string | null
          category: string | null
          client_id: string
          client_requirements: Json | null
          commission_rate: number | null
          completed_at: string | null
          created_at: string
          deadline: string | null
          delivery_format: string | null
          description: string | null
          end_time: string | null
          escrow_amount: number | null
          executor_id: string | null
          executor_proposal: Json | null
          id: string
          is_auto_closed: boolean | null
          max_revisions: number | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          people_accepted: number | null
          people_needed: number | null
          platform_fee: number | null
          price: number
          priority: string | null
          revision_count: number | null
          start_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ad_id?: string | null
          cancelled_at?: string | null
          category?: string | null
          client_id: string
          client_requirements?: Json | null
          commission_rate?: number | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          delivery_format?: string | null
          description?: string | null
          end_time?: string | null
          escrow_amount?: number | null
          executor_id?: string | null
          executor_proposal?: Json | null
          id?: string
          is_auto_closed?: boolean | null
          max_revisions?: number | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          people_accepted?: number | null
          people_needed?: number | null
          platform_fee?: number | null
          price: number
          priority?: string | null
          revision_count?: number | null
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ad_id?: string | null
          cancelled_at?: string | null
          category?: string | null
          client_id?: string
          client_requirements?: Json | null
          commission_rate?: number | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          delivery_format?: string | null
          description?: string | null
          end_time?: string | null
          escrow_amount?: number | null
          executor_id?: string | null
          executor_proposal?: Json | null
          id?: string
          is_auto_closed?: boolean | null
          max_revisions?: number | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          people_accepted?: number | null
          people_needed?: number | null
          platform_fee?: number | null
          price?: number
          priority?: string | null
          revision_count?: number | null
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          balance: number
          bio: string | null
          citizenship: string | null
          created_at: string | null
          display_name: string | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          phone: string | null
          qualification: string | null
          rating: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          telegram_id: number | null
          telegram_photo_url: string | null
          telegram_username: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          balance?: number
          bio?: string | null
          citizenship?: string | null
          created_at?: string | null
          display_name?: string | null
          full_name?: string | null
          id: string
          is_premium?: boolean | null
          phone?: string | null
          qualification?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          telegram_id?: number | null
          telegram_photo_url?: string | null
          telegram_username?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          balance?: number
          bio?: string | null
          citizenship?: string | null
          created_at?: string | null
          display_name?: string | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          phone?: string | null
          qualification?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          telegram_id?: number | null
          telegram_photo_url?: string | null
          telegram_username?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          availability: string | null
          category_id: string
          contact_info: string | null
          created_at: string
          description: string | null
          education: string | null
          experience_years: number | null
          hourly_rate: number
          id: string
          location: string | null
          portfolio_url: string | null
          skills: string[] | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          category_id: string
          contact_info?: string | null
          created_at?: string
          description?: string | null
          education?: string | null
          experience_years?: number | null
          hourly_rate?: number
          id?: string
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          category_id?: string
          contact_info?: string | null
          created_at?: string
          description?: string | null
          education?: string | null
          experience_years?: number | null
          hourly_rate?: number
          id?: string
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_resumes_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string | null
          id: string
          processed: boolean | null
          processed_at: string | null
          processed_by: string | null
          reason: string
          reporter_id: string
          review_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          reporter_id: string
          review_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          reporter_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string | null
          id: string
          is_moderated: boolean | null
          is_reported: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          rating: number | null
          target_user_id: string
          transaction_id: string | null
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_moderated?: boolean | null
          is_reported?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          rating?: number | null
          target_user_id: string
          transaction_id?: string | null
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_moderated?: boolean | null
          is_reported?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          rating?: number | null
          target_user_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          conversation_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          conversation_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          ticket_number: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          conversation_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_editable: boolean
          max_value: number | null
          min_value: number | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_editable?: boolean
          max_value?: number | null
          min_value?: number | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_editable?: boolean
          max_value?: number | null
          min_value?: number | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          admin_notes: string | null
          amount: number
          completed_at: string | null
          created_at: string | null
          id: string
          payment_details: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          processed_by: string | null
          proof_image: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          processed_by?: string | null
          proof_image?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          processed_by?: string | null
          proof_image?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          ban_type: Database["public"]["Enums"]["ban_type"]
          created_at: string
          duration_minutes: number
          expires_at: string
          id: string
          is_active: boolean
          issued_by: string
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ban_type: Database["public"]["Enums"]["ban_type"]
          created_at?: string
          duration_minutes: number
          expires_at: string
          id?: string
          is_active?: boolean
          issued_by: string
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ban_type?: Database["public"]["Enums"]["ban_type"]
          created_at?: string
          duration_minutes?: number
          expires_at?: string
          id?: string
          is_active?: boolean
          issued_by?: string
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users_auth: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          password_hash: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          password_hash: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deactivate_expired_bans: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_payment_details: {
        Args: {
          p_amount: number
          p_method: Database["public"]["Enums"]["payment_method"]
          p_user_id: string
        }
        Returns: Json
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_active_ban: {
        Args: {
          p_ban_type: Database["public"]["Enums"]["ban_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_ip_address?: string
          p_severity?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      register_user: {
        Args: { password_input: string; phone_input: string; user_data?: Json }
        Returns: string
      }
      verify_password: {
        Args: { password_input: string; phone_input: string }
        Returns: string
      }
    }
    Enums: {
      ad_status: "active" | "inactive" | "sold"
      ban_type: "order_mute" | "payment_mute" | "account_block"
      payment_method: "bank_card" | "yoomoney" | "ozon" | "manual_transfer"
      transaction_status: "pending" | "completed" | "rejected"
      transaction_type: "deposit" | "withdrawal" | "payment" | "purchase"
      user_role: "user" | "system_admin" | "admin" | "moderator" | "support"
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
      ad_status: ["active", "inactive", "sold"],
      ban_type: ["order_mute", "payment_mute", "account_block"],
      payment_method: ["bank_card", "yoomoney", "ozon", "manual_transfer"],
      transaction_status: ["pending", "completed", "rejected"],
      transaction_type: ["deposit", "withdrawal", "payment", "purchase"],
      user_role: ["user", "system_admin", "admin", "moderator", "support"],
    },
  },
} as const
