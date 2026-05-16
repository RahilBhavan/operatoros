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
      accountant_access_log: {
        Row: {
          accessed_at: string
          action: string
          connection_id: string
          id: string
          ip_hash: string | null
          user_agent_fragment: string | null
        }
        Insert: {
          accessed_at?: string
          action?: string
          connection_id: string
          id?: string
          ip_hash?: string | null
          user_agent_fragment?: string | null
        }
        Update: {
          accessed_at?: string
          action?: string
          connection_id?: string
          id?: string
          ip_hash?: string | null
          user_agent_fragment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accountant_access_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "accountant_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      accountant_connections: {
        Row: {
          accountant_email: string
          accountant_name: string | null
          business_id: string
          created_at: string | null
          expires_at: string
          id: string
          last_accessed_at: string | null
          revoked_at: string | null
          token: string
        }
        Insert: {
          accountant_email: string
          accountant_name?: string | null
          business_id: string
          created_at?: string | null
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          revoked_at?: string | null
          token?: string
        }
        Update: {
          accountant_email?: string
          accountant_name?: string | null
          business_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountant_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      accountant_deadline_notes: {
        Row: {
          accountant_token: string
          created_at: string
          deadline_id: string
          id: string
          note: string
          updated_at: string
        }
        Insert: {
          accountant_token: string
          created_at?: string
          deadline_id: string
          id?: string
          note: string
          updated_at?: string
        }
        Update: {
          accountant_token?: string
          created_at?: string
          deadline_id?: string
          id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountant_deadline_notes_deadline_id_fkey"
            columns: ["deadline_id"]
            isOneToOne: false
            referencedRelation: "deadlines"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insight_cache: {
        Row: {
          business_id: string
          context_hash: string
          generated_at: string
          insights: Json
        }
        Insert: {
          business_id: string
          context_hash: string
          generated_at?: string
          insights: Json
        }
        Update: {
          business_id?: string
          context_hash?: string
          generated_at?: string
          insights?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_insight_cache_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rate_limits: {
        Row: {
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          actor_user_id: string | null
          business_id: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          target_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          business_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          target_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          business_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          after_state: Json | null
          before_state: Json | null
          business_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          before_state?: Json | null
          business_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          before_state?: Json | null
          business_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_rate_limits: {
        Row: {
          attempts: number
          key: string
          window_start: string
        }
        Insert: {
          attempts?: number
          key: string
          window_start?: string
        }
        Update: {
          attempts?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          account_type: string
          billing_status: string
          created_at: string
          employee_count: number | null
          entity_type: string | null
          hires_contractors: boolean
          id: string
          industry_slug: string | null
          name: string
          onboarding_complete: boolean
          owner_id: string
          plan_tier: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
        }
        Insert: {
          account_type?: string
          billing_status?: string
          created_at?: string
          employee_count?: number | null
          entity_type?: string | null
          hires_contractors?: boolean
          id?: string
          industry_slug?: string | null
          name: string
          onboarding_complete?: boolean
          owner_id: string
          plan_tier?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          account_type?: string
          billing_status?: string
          created_at?: string
          employee_count?: number | null
          entity_type?: string | null
          hires_contractors?: boolean
          id?: string
          industry_slug?: string | null
          name?: string
          onboarding_complete?: boolean
          owner_id?: string
          plan_tier?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      compliance_score_history: {
        Row: {
          business_id: string
          id: string
          recorded_at: string | null
          score: number
        }
        Insert: {
          business_id: string
          id?: string
          recorded_at?: string | null
          score: number
        }
        Update: {
          business_id?: string
          id?: string
          recorded_at?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_score_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          assigned_to: string | null
          business_id: string
          created_at: string
          deadline_type: string
          description: string | null
          due_date: string
          frequency: string
          governing_agency: string | null
          id: string
          location_id: string | null
          name: string
          occurrence_key: string | null
          penalty_estimate_cents: number | null
          regulatory_rule_id: string | null
          rule_id: string | null
          rule_version: number | null
          severity_tier: string
          source: string
          source_url: string | null
          status: string
          statute_citation: string | null
          superseded_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          created_at?: string
          deadline_type?: string
          description?: string | null
          due_date: string
          frequency?: string
          governing_agency?: string | null
          id?: string
          location_id?: string | null
          name: string
          occurrence_key?: string | null
          penalty_estimate_cents?: number | null
          regulatory_rule_id?: string | null
          rule_id?: string | null
          rule_version?: number | null
          severity_tier?: string
          source?: string
          source_url?: string | null
          status?: string
          statute_citation?: string | null
          superseded_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          created_at?: string
          deadline_type?: string
          description?: string | null
          due_date?: string
          frequency?: string
          governing_agency?: string | null
          id?: string
          location_id?: string | null
          name?: string
          occurrence_key?: string | null
          penalty_estimate_cents?: number | null
          regulatory_rule_id?: string | null
          rule_id?: string | null
          rule_version?: number | null
          severity_tier?: string
          source?: string
          source_url?: string | null
          status?: string
          statute_citation?: string | null
          superseded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_regulatory_rule_id_fkey"
            columns: ["regulatory_rule_id"]
            isOneToOne: false
            referencedRelation: "regulatory_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          business_id: string
          document_id: string
          file_path: string
          file_type: string
          id: string
          superseded_at: string
          uploaded_by: string | null
        }
        Insert: {
          business_id: string
          document_id: string
          file_path: string
          file_type: string
          id?: string
          superseded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          business_id?: string
          document_id?: string
          file_path?: string
          file_type?: string
          id?: string
          superseded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          business_id: string
          deadline_id: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_type: string
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          business_id: string
          deadline_id: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_type: string
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          business_id?: string
          deadline_id?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_deadline_id_fkey"
            columns: ["deadline_id"]
            isOneToOne: false
            referencedRelation: "deadlines"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          business_id: string
          city: string | null
          county: string | null
          id: string
          state: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          city?: string | null
          county?: string | null
          id?: string
          state: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          city?: string | null
          county?: string | null
          id?: string
          state?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          invited_email: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_email?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_email?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admin_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          invited_email: string
          revoked_at: string | null
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          invited_email: string
          revoked_at?: string | null
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          invited_email?: string
          revoked_at?: string | null
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      regulatory_rule_sources: {
        Row: {
          created_at: string
          id: string
          rule_id: string
          source_kind: string
          source_ref: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          rule_id: string
          source_kind: string
          source_ref?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          rule_id?: string
          source_kind?: string
          source_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_rule_sources_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "regulatory_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_rules: {
        Row: {
          applies_when: Json
          created_at: string
          deadline_type: string
          description: string
          due_date_rule: Json
          effective_date: string
          frequency: string
          governing_agency: string
          id: string
          industry_slug: string | null
          jurisdiction_code: string
          jurisdiction_type: string
          last_verified_at: string | null
          last_verified_by: string | null
          name: string
          penalty_estimate_cents: number | null
          rule_key: string
          severity_tier: string
          source_url: string | null
          statute_citation: string | null
          sunset_date: string | null
          superseded_by: string | null
          updated_at: string
          version: number
        }
        Insert: {
          applies_when?: Json
          created_at?: string
          deadline_type: string
          description: string
          due_date_rule: Json
          effective_date?: string
          frequency: string
          governing_agency: string
          id?: string
          industry_slug?: string | null
          jurisdiction_code: string
          jurisdiction_type: string
          last_verified_at?: string | null
          last_verified_by?: string | null
          name: string
          penalty_estimate_cents?: number | null
          rule_key: string
          severity_tier: string
          source_url?: string | null
          statute_citation?: string | null
          sunset_date?: string | null
          superseded_by?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          applies_when?: Json
          created_at?: string
          deadline_type?: string
          description?: string
          due_date_rule?: Json
          effective_date?: string
          frequency?: string
          governing_agency?: string
          id?: string
          industry_slug?: string | null
          jurisdiction_code?: string
          jurisdiction_type?: string
          last_verified_at?: string | null
          last_verified_by?: string | null
          name?: string
          penalty_estimate_cents?: number | null
          rule_key?: string
          severity_tier?: string
          source_url?: string | null
          statute_citation?: string | null
          sunset_date?: string | null
          superseded_by?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_rules_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "regulatory_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_log: {
        Row: {
          business_id: string
          clicked_at: string | null
          deadline_id: string
          id: string
          opened_at: string | null
          recipient_email: string
          reminder_type: string
          sent_at: string
          status: string
        }
        Insert: {
          business_id: string
          clicked_at?: string | null
          deadline_id: string
          id?: string
          opened_at?: string | null
          recipient_email: string
          reminder_type: string
          sent_at?: string
          status?: string
        }
        Update: {
          business_id?: string
          clicked_at?: string | null
          deadline_id?: string
          id?: string
          opened_at?: string | null
          recipient_email?: string
          reminder_type?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_log_deadline_id_fkey"
            columns: ["deadline_id"]
            isOneToOne: false
            referencedRelation: "deadlines"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_preferences: {
        Row: {
          business_id: string
          created_at: string
          digest_only: boolean
          email_enabled: boolean
          muted_until: string | null
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          digest_only?: boolean
          email_enabled?: boolean
          muted_until?: string | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          digest_only?: boolean
          email_enabled?: boolean
          muted_until?: string | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      share_link_views: {
        Row: {
          id: string
          ip_hash: string | null
          share_token_id: string
          user_agent_fragment: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_hash?: string | null
          share_token_id: string
          user_agent_fragment?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_hash?: string | null
          share_token_id?: string
          user_agent_fragment?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_link_views_share_token_id_fkey"
            columns: ["share_token_id"]
            isOneToOne: false
            referencedRelation: "share_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          business_id: string
          created_at: string
          created_by_user_id: string | null
          expires_at: string
          id: string
          label: string | null
          last_viewed_at: string | null
          revoked_at: string | null
          token: string
          view_count: number
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_user_id?: string | null
          expires_at?: string
          id?: string
          label?: string | null
          last_viewed_at?: string | null
          revoked_at?: string | null
          token?: string
          view_count?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_user_id?: string | null
          expires_at?: string
          id?: string
          label?: string | null
          last_viewed_at?: string | null
          revoked_at?: string | null
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "share_tokens_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          confirmation_sent_at: string | null
          email: string
          id: string
          industry_slug: string | null
          invited_at: string | null
          landing_path: string | null
          notes: string | null
          referral_code: string | null
          referred_by_code: string | null
          referrer: string | null
          signed_up_at: string
          source: string | null
          state: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          confirmation_sent_at?: string | null
          email: string
          id?: string
          industry_slug?: string | null
          invited_at?: string | null
          landing_path?: string | null
          notes?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          referrer?: string | null
          signed_up_at?: string
          source?: string | null
          state?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          confirmation_sent_at?: string | null
          email?: string
          id?: string
          industry_slug?: string | null
          invited_at?: string | null
          landing_path?: string | null
          notes?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          referrer?: string | null
          signed_up_at?: string
          source?: string | null
          state?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_rate_limit: {
        Args: { p_rate_limit: number; p_user_id: string; p_window_ms: number }
        Returns: boolean
      }
      claim_platform_admin_invite: {
        Args: { p_display_name: string; p_token: string }
        Returns: boolean
      }
      complete_onboarding: {
        Args: { p_business: Json; p_location: Json; p_seeds: Json }
        Returns: string
      }
      is_platform_admin: { Args: never; Returns: boolean }
      record_share_view: {
        Args: { p_ip_hash: string; p_token: string; p_user_agent: string }
        Returns: undefined
      }
      try_consume_ai_rate_limit: {
        Args: { p_max: number; p_window: string }
        Returns: boolean
      }
      try_consume_auth_rate_limit: {
        Args: {
          p_key: string
          p_max_attempts: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      unsubscribe_reminders: { Args: { p_token: string }; Returns: boolean }
      version_regulatory_rule: {
        Args: { p_changes: Json; p_rule_id: string }
        Returns: string
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
