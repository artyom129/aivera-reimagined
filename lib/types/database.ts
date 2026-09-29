export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          language: Database["public"]["Enums"]["app_language"]
          token_limit: number
          tokens_used: number
          is_blocked: boolean
          blocked_reason: string | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          language?: Database["public"]["Enums"]["app_language"]
          token_limit?: number
          tokens_used?: number
          is_blocked?: boolean
          blocked_reason?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          language?: Database["public"]["Enums"]["app_language"]
          token_limit?: number
          tokens_used?: number
          is_blocked?: boolean
          blocked_reason?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          id: string
          user_id: string
          folder_id: string | null
          title: string
          ai_mode: Database["public"]["Enums"]["ai_mode"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_id?: string | null
          title?: string
          ai_mode?: Database["public"]["Enums"]["ai_mode"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string | null
          title?: string
          ai_mode?: Database["public"]["Enums"]["ai_mode"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: Database["public"]["Enums"]["message_role"]
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: Database["public"]["Enums"]["message_role"]
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          role?: Database["public"]["Enums"]["message_role"]
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          content: string
          variables: Json
          category: string | null
          is_public: boolean
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          content: string
          variables?: Json
          category?: string | null
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          content?: string
          variables?: Json
          category?: string | null
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          model: string
          tokens_used: number
          cost: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model: string
          tokens_used: number
          cost?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model?: string
          tokens_used?: number
          cost?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string | null
          target_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type?: string | null
          target_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_type?: string | null
          target_id?: string | null
          details?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_request_log: {
        Row: {
          id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: never
          user_id: string
          created_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_request_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          value: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      claim_ai_request: {
        Args: { p_limit?: number }
        Returns: boolean
      }
      record_ai_usage: {
        Args: { p_model: string; p_tokens: number }
        Returns: undefined
      }
      increment_template_usage: {
        Args: { p_template_id: string }
        Returns: number
      }
      record_login: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_target_type: string
          p_target_id: string
          p_details?: Json
        }
        Returns: undefined
      }
      get_admin_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      user_role: "teacher" | "admin"
      subscription_tier: "free" | "basic" | "premium"
      app_language: "ru" | "kk" | "en"
      ai_mode: "default" | "lesson_plan" | "tests" | "feedback"
      message_role: "user" | "assistant"
    }
    CompositeTypes: Record<string, never>
  }
}

