export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      waitlist_signups: {
        Row: {
          id: string;
          email: string;
          signed_up_at: string;
          source: string | null;
          notes: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          referrer: string | null;
          landing_path: string | null;
          state: string | null;
          industry_slug: string | null;
          referral_code: string;
          referred_by_code: string | null;
          confirmation_sent_at: string | null;
          invited_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          signed_up_at?: string;
          source?: string | null;
          notes?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          referrer?: string | null;
          landing_path?: string | null;
          state?: string | null;
          industry_slug?: string | null;
          referral_code?: string;
          referred_by_code?: string | null;
          confirmation_sent_at?: string | null;
          invited_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          signed_up_at?: string;
          source?: string | null;
          notes?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          referrer?: string | null;
          landing_path?: string | null;
          state?: string | null;
          industry_slug?: string | null;
          referral_code?: string;
          referred_by_code?: string | null;
          confirmation_sent_at?: string | null;
          invited_at?: string | null;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: "admin" | "member";
          invited_email: string | null;
          created_at: string;
          invite_token: string | null;
          invite_expires_at: string | null;
          accepted_at: string | null;
          status: "pending" | "active" | "revoked";
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: "admin" | "member";
          invited_email?: string | null;
          created_at?: string;
          invite_token?: string | null;
          invite_expires_at?: string | null;
          accepted_at?: string | null;
          status?: "pending" | "active" | "revoked";
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: "admin" | "member";
          invited_email?: string | null;
          created_at?: string;
          invite_token?: string | null;
          invite_expires_at?: string | null;
          accepted_at?: string | null;
          status?: "pending" | "active" | "revoked";
        };
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          industry_slug: string | null;
          entity_type: string | null;
          employee_count: number | null;
          hires_contractors: boolean;
          created_at: string;
          onboarding_complete: boolean;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan_tier: "free" | "business" | "accountant";
          billing_status: "trialing" | "active" | "past_due" | "canceled" | "inactive";
          trial_ends_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          industry_slug?: string | null;
          entity_type?: string | null;
          employee_count?: number | null;
          hires_contractors?: boolean;
          created_at?: string;
          onboarding_complete?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_tier?: "free" | "business" | "accountant";
          billing_status?: "trialing" | "active" | "past_due" | "canceled" | "inactive";
          trial_ends_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          industry_slug?: string | null;
          entity_type?: string | null;
          employee_count?: number | null;
          hires_contractors?: boolean;
          created_at?: string;
          onboarding_complete?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_tier?: "free" | "business" | "accountant";
          billing_status?: "trialing" | "active" | "past_due" | "canceled" | "inactive";
          trial_ends_at?: string | null;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          business_id: string;
          address: string | null;
          city: string | null;
          state: string;
          county: string | null;
          zip: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          address?: string | null;
          city?: string | null;
          state: string;
          county?: string | null;
          zip?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          address?: string | null;
          city?: string | null;
          state?: string;
          county?: string | null;
          zip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "locations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      deadlines: {
        Row: {
          id: string;
          business_id: string;
          location_id: string | null;
          name: string;
          description: string | null;
          deadline_type: string;
          governing_agency: string | null;
          frequency: string;
          due_date: string;
          status: "upcoming" | "compliant" | "overdue" | "in_progress";
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          source: string;
          severity_tier: "critical" | "high" | "medium" | "low" | "info";
          penalty_estimate_cents: number | null;
          source_url: string | null;
          statute_citation: string | null;
          regulatory_rule_id: string | null;
          rule_id: string | null;
          rule_version: number | null;
          occurrence_key: string | null;
          superseded_at: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          location_id?: string | null;
          name: string;
          description?: string | null;
          deadline_type: string;
          governing_agency?: string | null;
          frequency?: string;
          due_date: string;
          status?: "upcoming" | "compliant" | "overdue" | "in_progress";
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          source?: string;
          severity_tier?: "critical" | "high" | "medium" | "low" | "info";
          penalty_estimate_cents?: number | null;
          source_url?: string | null;
          statute_citation?: string | null;
          regulatory_rule_id?: string | null;
          rule_id?: string | null;
          rule_version?: number | null;
          occurrence_key?: string | null;
          superseded_at?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          location_id?: string | null;
          name?: string;
          description?: string | null;
          deadline_type?: string;
          governing_agency?: string | null;
          frequency?: string;
          due_date?: string;
          status?: "upcoming" | "compliant" | "overdue" | "in_progress";
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          source?: string;
          severity_tier?: "critical" | "high" | "medium" | "low" | "info";
          penalty_estimate_cents?: number | null;
          source_url?: string | null;
          statute_citation?: string | null;
          regulatory_rule_id?: string | null;
          rule_id?: string | null;
          rule_version?: number | null;
          occurrence_key?: string | null;
          superseded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deadlines_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          id: string;
          deadline_id: string;
          business_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          uploaded_by: string;
          uploaded_at: string;
          expiry_date: string | null;
        };
        Insert: {
          id?: string;
          deadline_id: string;
          business_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          uploaded_by: string;
          uploaded_at?: string;
          expiry_date?: string | null;
        };
        Update: {
          id?: string;
          deadline_id?: string;
          business_id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: string;
          uploaded_by?: string;
          uploaded_at?: string;
          expiry_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_deadline_id_fkey";
            columns: ["deadline_id"];
            isOneToOne: false;
            referencedRelation: "deadlines";
            referencedColumns: ["id"];
          }
        ];
      };
      reminder_log: {
        Row: {
          id: string;
          deadline_id: string;
          business_id: string;
          reminder_type: "90_day" | "60_day" | "30_day" | "7_day" | "1_day";
          sent_at: string;
          recipient_email: string;
          status: "sent" | "failed";
          opened_at: string | null;
          clicked_at: string | null;
        };
        Insert: {
          id?: string;
          deadline_id: string;
          business_id: string;
          reminder_type: "90_day" | "60_day" | "30_day" | "7_day" | "1_day";
          sent_at?: string;
          recipient_email: string;
          status?: "sent" | "failed";
          opened_at?: string | null;
          clicked_at?: string | null;
        };
        Update: {
          id?: string;
          deadline_id?: string;
          business_id?: string;
          reminder_type?: "90_day" | "60_day" | "30_day" | "7_day" | "1_day";
          sent_at?: string;
          recipient_email?: string;
          status?: "sent" | "failed";
          opened_at?: string | null;
          clicked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reminder_log_deadline_id_fkey";
            columns: ["deadline_id"];
            isOneToOne: false;
            referencedRelation: "deadlines";
            referencedColumns: ["id"];
          }
        ];
      };
      share_tokens: {
        Row: {
          id: string;
          business_id: string;
          token: string;
          expires_at: string;
          created_at: string;
          label: string | null;
          created_by_user_id: string | null;
          view_count: number;
          last_viewed_at: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
          label?: string | null;
          created_by_user_id?: string | null;
          view_count?: number;
          last_viewed_at?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
          label?: string | null;
          created_by_user_id?: string | null;
          view_count?: number;
          last_viewed_at?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "share_tokens_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      compliance_score_history: {
        Row: {
          id: string;
          business_id: string;
          score: number;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          score: number;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          score?: number;
          recorded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_score_history_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      accountant_connections: {
        Row: {
          id: string;
          business_id: string;
          accountant_email: string;
          accountant_name: string | null;
          token: string;
          created_at: string;
          last_accessed_at: string | null;
          expires_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          accountant_email: string;
          accountant_name?: string | null;
          token?: string;
          created_at?: string;
          last_accessed_at?: string | null;
          expires_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          accountant_email?: string;
          accountant_name?: string | null;
          token?: string;
          created_at?: string;
          last_accessed_at?: string | null;
          expires_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_connections_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      accountant_deadline_notes: {
        Row: {
          id: string;
          deadline_id: string;
          accountant_token: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deadline_id: string;
          accountant_token: string;
          note: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deadline_id?: string;
          accountant_token?: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_deadline_notes_deadline_id_fkey";
            columns: ["deadline_id"];
            isOneToOne: false;
            referencedRelation: "deadlines";
            referencedColumns: ["id"];
          }
        ];
      };
      share_link_views: {
        Row: {
          id: string;
          share_token_id: string;
          viewed_at: string;
          ip_hash: string | null;
          user_agent_fragment: string | null;
        };
        Insert: {
          id?: string;
          share_token_id: string;
          viewed_at?: string;
          ip_hash?: string | null;
          user_agent_fragment?: string | null;
        };
        Update: {
          id?: string;
          share_token_id?: string;
          viewed_at?: string;
          ip_hash?: string | null;
          user_agent_fragment?: string | null;
        };
        Relationships: [];
      };
      accountant_access_log: {
        Row: {
          id: string;
          connection_id: string;
          accessed_at: string;
          ip_hash: string | null;
          user_agent_fragment: string | null;
          action: "view" | "note_added" | "note_edited" | "export";
        };
        Insert: {
          id?: string;
          connection_id: string;
          accessed_at?: string;
          ip_hash?: string | null;
          user_agent_fragment?: string | null;
          action?: "view" | "note_added" | "note_edited" | "export";
        };
        Update: {
          id?: string;
          connection_id?: string;
          accessed_at?: string;
          ip_hash?: string | null;
          user_agent_fragment?: string | null;
          action?: "view" | "note_added" | "note_edited" | "export";
        };
        Relationships: [];
      };
      reminder_preferences: {
        Row: {
          business_id: string;
          unsubscribe_token: string;
          email_enabled: boolean;
          digest_only: boolean;
          muted_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          unsubscribe_token?: string;
          email_enabled?: boolean;
          digest_only?: boolean;
          muted_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          unsubscribe_token?: string;
          email_enabled?: boolean;
          digest_only?: boolean;
          muted_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          business_id: string | null;
          actor_user_id: string | null;
          event_type: string;
          target_id: string | null;
          metadata: Record<string, unknown>;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string | null;
          actor_user_id?: string | null;
          event_type: string;
          target_id?: string | null;
          metadata?: Record<string, unknown>;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string | null;
          actor_user_id?: string | null;
          event_type?: string;
          target_id?: string | null;
          metadata?: Record<string, unknown>;
          occurred_at?: string;
        };
        Relationships: [];
      };
      ai_insight_cache: {
        Row: {
          business_id: string;
          context_hash: string;
          insights: Array<{ title: string; body: string; urgency: string; source_url?: string }>;
          generated_at: string;
        };
        Insert: {
          business_id: string;
          context_hash: string;
          insights: Array<{ title: string; body: string; urgency: string; source_url?: string }>;
          generated_at?: string;
        };
        Update: {
          business_id?: string;
          context_hash?: string;
          insights?: Array<{ title: string; body: string; urgency: string; source_url?: string }>;
          generated_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          user_id: string;
          display_name: string | null;
          created_at: string;
          created_by: string | null;
          revoked_at: string | null;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      platform_admin_invites: {
        Row: {
          id: string;
          token: string;
          invited_email: string;
          created_by: string;
          created_at: string;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          token?: string;
          invited_email: string;
          created_by: string;
          created_at?: string;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          token?: string;
          invited_email?: string;
          created_by?: string;
          created_at?: string;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          business_id: string;
          file_path: string;
          file_type: string;
          superseded_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          business_id: string;
          file_path: string;
          file_type: string;
          superseded_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          id?: string;
          document_id?: string;
          business_id?: string;
          file_path?: string;
          file_type?: string;
          superseded_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [];
      };
      auth_rate_limits: {
        Row: {
          key: string;
          attempts: number;
          window_start: string;
        };
        Insert: {
          key: string;
          attempts?: number;
          window_start?: string;
        };
        Update: {
          key?: string;
          attempts?: number;
          window_start?: string;
        };
        Relationships: [];
      };
      regulatory_rules: {
        Row: {
          id: string;
          rule_key: string;
          version: number;
          name: string;
          description: string;
          jurisdiction_type: string;
          jurisdiction_code: string;
          industry_slug: string | null;
          deadline_type: string;
          governing_agency: string;
          frequency: string;
          severity_tier: string;
          penalty_estimate_cents: number | null;
          statute_citation: string | null;
          source_url: string | null;
          due_date_rule: Json;
          applies_when: Json;
          effective_date: string;
          sunset_date: string | null;
          superseded_by: string | null;
          last_verified_at: string | null;
          last_verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_key: string;
          version?: number;
          name: string;
          description: string;
          jurisdiction_type: string;
          jurisdiction_code: string;
          industry_slug?: string | null;
          deadline_type: string;
          governing_agency: string;
          frequency: string;
          severity_tier: string;
          penalty_estimate_cents?: number | null;
          statute_citation?: string | null;
          source_url?: string | null;
          due_date_rule?: Json;
          applies_when?: Json;
          effective_date?: string;
          sunset_date?: string | null;
          superseded_by?: string | null;
          last_verified_at?: string | null;
          last_verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rule_key?: string;
          version?: number;
          name?: string;
          description?: string;
          jurisdiction_type?: string;
          jurisdiction_code?: string;
          industry_slug?: string | null;
          deadline_type?: string;
          governing_agency?: string;
          frequency?: string;
          severity_tier?: string;
          penalty_estimate_cents?: number | null;
          statute_citation?: string | null;
          source_url?: string | null;
          due_date_rule?: Json;
          applies_when?: Json;
          effective_date?: string;
          sunset_date?: string | null;
          superseded_by?: string | null;
          last_verified_at?: string | null;
          last_verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      regulatory_rule_sources: {
        Row: {
          id: string;
          rule_id: string;
          source_kind: string;
          source_ref: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          source_kind: string;
          source_ref?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          source_kind?: string;
          source_ref?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      industry_benchmarks: {
        Row: {
          industry_slug: string;
          state_code: string;
          cohort_size: number;
          p25: number;
          median: number;
          p75: number;
          p90: number;
          last_captured_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_and_increment_rate_limit: {
        Args: {
          p_user_id: string;
          p_rate_limit: number;
          p_window_ms: number;
        };
        Returns: boolean;
      };
      try_consume_ai_rate_limit: {
        Args: { p_max: number; p_window: string };
        Returns: boolean;
      };
      record_share_view: {
        Args: { p_token: string; p_ip_hash: string | null; p_user_agent: string | null };
        Returns: void;
      };
      unsubscribe_reminders: {
        Args: { p_token: string };
        Returns: boolean;
      };
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      claim_platform_admin_invite: {
        Args: { p_token: string; p_display_name: string };
        Returns: boolean;
      };
      try_consume_auth_rate_limit: {
        Args: { p_key: string; p_max_attempts: number; p_window_seconds: number };
        Returns: boolean;
      };
      complete_onboarding: {
        Args: { p_business: Json; p_location: Json; p_seeds: Json };
        Returns: string;
      };
      version_regulatory_rule: {
        Args: { p_rule_id: string; p_changes: Json };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
