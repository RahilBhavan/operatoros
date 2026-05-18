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
          plan_tier: "free" | "lite" | "business" | "accountant";
          billing_status: "trialing" | "active" | "past_due" | "canceled" | "inactive";
          trial_ends_at: string | null;
          invited_by_accountant_id: string | null;
          invite_code: string | null;
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
          plan_tier?: "free" | "lite" | "business" | "accountant";
          billing_status?: "trialing" | "active" | "past_due" | "canceled" | "inactive";
          trial_ends_at?: string | null;
          invited_by_accountant_id?: string | null;
          invite_code?: string | null;
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
          plan_tier?: "free" | "lite" | "business" | "accountant";
          billing_status?: "trialing" | "active" | "past_due" | "canceled" | "inactive";
          trial_ends_at?: string | null;
          invited_by_accountant_id?: string | null;
          invite_code?: string | null;
        };
        Relationships: [];
      };
      accountant_invite_links: {
        Row: {
          id: string;
          accountant_id: string;
          code: string;
          label: string | null;
          signups_count: number;
          paid_conversions_count: number;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          accountant_id: string;
          code: string;
          label?: string | null;
          signups_count?: number;
          paid_conversions_count?: number;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          accountant_id?: string;
          code?: string;
          label?: string | null;
          signups_count?: number;
          paid_conversions_count?: number;
          created_at?: string;
          revoked_at?: string | null;
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
          // WS-3.4 — multi-location columns added in 20260518000005.
          name: string | null;
          open_date: string | null;
          close_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          address?: string | null;
          city?: string | null;
          state: string;
          county?: string | null;
          zip?: string | null;
          name?: string | null;
          open_date?: string | null;
          close_date?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          address?: string | null;
          city?: string | null;
          state?: string;
          county?: string | null;
          zip?: string | null;
          name?: string | null;
          open_date?: string | null;
          close_date?: string | null;
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
      regulatory_rules: {
        Row: {
          id: string;
          jurisdiction_type: "federal" | "state" | "local";
          jurisdiction_code: string;
          industry_slug: string | null;
          rule_key: string;
          name: string;
          description: string;
          deadline_type: string;
          governing_agency: string;
          frequency: string;
          due_date_rule: Record<string, unknown>;
          applies_when: Record<string, unknown>;
          severity_tier: "critical" | "high" | "medium" | "low" | "info";
          penalty_estimate_cents: number | null;
          source_url: string | null;
          statute_citation: string | null;
          effective_date: string;
          sunset_date: string | null;
          version: number;
          superseded_by: string | null;
          last_verified_at: string | null;
          last_verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          jurisdiction_type: "federal" | "state" | "local";
          jurisdiction_code: string;
          industry_slug?: string | null;
          rule_key: string;
          name: string;
          description: string;
          deadline_type: string;
          governing_agency: string;
          frequency: string;
          due_date_rule: Record<string, unknown>;
          applies_when?: Record<string, unknown>;
          severity_tier: "critical" | "high" | "medium" | "low" | "info";
          penalty_estimate_cents?: number | null;
          source_url?: string | null;
          statute_citation?: string | null;
          effective_date?: string;
          sunset_date?: string | null;
          version?: number;
          superseded_by?: string | null;
          last_verified_at?: string | null;
          last_verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          jurisdiction_type?: "federal" | "state" | "local";
          jurisdiction_code?: string;
          industry_slug?: string | null;
          rule_key?: string;
          name?: string;
          description?: string;
          deadline_type?: string;
          governing_agency?: string;
          frequency?: string;
          due_date_rule?: Record<string, unknown>;
          applies_when?: Record<string, unknown>;
          severity_tier?: "critical" | "high" | "medium" | "low" | "info";
          penalty_estimate_cents?: number | null;
          source_url?: string | null;
          statute_citation?: string | null;
          effective_date?: string;
          sunset_date?: string | null;
          version?: number;
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
          source_kind: "seed" | "accountant_correction" | "admin_edit" | "agency_scrape";
          source_ref: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          source_kind: "seed" | "accountant_correction" | "admin_edit" | "agency_scrape";
          source_ref?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          source_kind?: "seed" | "accountant_correction" | "admin_edit" | "agency_scrape";
          source_ref?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "regulatory_rule_sources_rule_id_fkey";
            columns: ["rule_id"];
            isOneToOne: false;
            referencedRelation: "regulatory_rules";
            referencedColumns: ["id"];
          }
        ];
      };
      rule_corrections: {
        Row: {
          id: string;
          rule_id: string;
          proposed_by_connection_id: string | null;
          proposed_by_user_id: string | null;
          proposed_by_kind: "accountant" | "admin" | "business_member";
          proposed_changes: Record<string, unknown>;
          rationale: string;
          citation_url: string | null;
          status: "pending" | "accepted" | "rejected" | "superseded";
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          resulting_rule_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          proposed_by_connection_id?: string | null;
          proposed_by_user_id?: string | null;
          proposed_by_kind: "accountant" | "admin" | "business_member";
          proposed_changes: Record<string, unknown>;
          rationale: string;
          citation_url?: string | null;
          status?: "pending" | "accepted" | "rejected" | "superseded";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          resulting_rule_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          proposed_by_connection_id?: string | null;
          proposed_by_user_id?: string | null;
          proposed_by_kind?: "accountant" | "admin" | "business_member";
          proposed_changes?: Record<string, unknown>;
          rationale?: string;
          citation_url?: string | null;
          status?: "pending" | "accepted" | "rejected" | "superseded";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          resulting_rule_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rule_corrections_rule_id_fkey";
            columns: ["rule_id"];
            isOneToOne: false;
            referencedRelation: "regulatory_rules";
            referencedColumns: ["id"];
          }
        ];
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
      stripe_received_events: {
        Row: {
          event_id: string;
          event_type: string;
          received_at: string;
        };
        Insert: {
          event_id: string;
          event_type: string;
          received_at?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          received_at?: string;
        };
        Relationships: [];
      };
      stripe_subscriptions: {
        Row: {
          id: string;
          business_id: string | null;
          customer_id: string;
          status: string;
          price_id: string;
          plan_tier: "business" | "accountant" | "lite";
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          trial_end: string | null;
          unit_amount_cents: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          business_id?: string | null;
          customer_id: string;
          status: string;
          price_id: string;
          plan_tier: "business" | "accountant" | "lite";
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          trial_end?: string | null;
          unit_amount_cents: number;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string | null;
          customer_id?: string;
          status?: string;
          price_id?: string;
          plan_tier?: "business" | "accountant" | "lite";
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          trial_end?: string | null;
          unit_amount_cents?: number;
          currency?: string;
          updated_at?: string;
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
      rule_confidence: {
        Row: {
          rule_id: string;
          confidence_tier:
            | "low"
            | "unverified"
            | "stale"
            | "community_validated"
            | "baseline";
          accepted_corrections: number;
          pending_corrections: number;
          rejected_corrections: number;
          last_verified_at: string | null;
        };
        Relationships: [];
      };
      staff_members: {
        Row: {
          id: string;
          business_id: string;
          full_name: string;
          email: string | null;
          role: string | null;
          employment_type: "w2" | "1099" | "volunteer" | "owner" | "other" | null;
          hire_date: string | null;
          end_date: string | null;
          user_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          full_name: string;
          email?: string | null;
          role?: string | null;
          employment_type?: "w2" | "1099" | "volunteer" | "owner" | "other" | null;
          hire_date?: string | null;
          end_date?: string | null;
          user_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          full_name?: string;
          email?: string | null;
          role?: string | null;
          employment_type?: "w2" | "1099" | "volunteer" | "owner" | "other" | null;
          hire_date?: string | null;
          end_date?: string | null;
          user_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      credential_types: {
        Row: {
          id: string;
          slug: string;
          name: string;
          agency: string | null;
          jurisdiction_code: string | null;
          vertical_tag:
            | "healthcare"
            | "construction"
            | "food_service"
            | "personal_services"
            | "retail"
            | "transportation"
            | "manufacturing"
            | "fitness"
            | "business_services"
            | "other"
            | null;
          default_validity_days: number | null;
          description: string | null;
          source_url: string | null;
          ce_required_hours: number | null;
          ce_period_months: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          agency?: string | null;
          jurisdiction_code?: string | null;
          vertical_tag?:
            | "healthcare"
            | "construction"
            | "food_service"
            | "personal_services"
            | "retail"
            | "transportation"
            | "manufacturing"
            | "fitness"
            | "business_services"
            | "other"
            | null;
          default_validity_days?: number | null;
          description?: string | null;
          source_url?: string | null;
          ce_required_hours?: number | null;
          ce_period_months?: number | null;
        };
        Update: {
          slug?: string;
          name?: string;
          agency?: string | null;
          jurisdiction_code?: string | null;
          vertical_tag?:
            | "healthcare"
            | "construction"
            | "food_service"
            | "personal_services"
            | "retail"
            | "transportation"
            | "manufacturing"
            | "fitness"
            | "business_services"
            | "other"
            | null;
          default_validity_days?: number | null;
          description?: string | null;
          source_url?: string | null;
          ce_required_hours?: number | null;
          ce_period_months?: number | null;
        };
        Relationships: [];
      };
      staff_credentials: {
        Row: {
          id: string;
          staff_member_id: string;
          credential_type_id: string;
          business_id: string;
          identifier: string | null;
          issued_date: string | null;
          expires_date: string | null;
          status: "active" | "expired" | "pending" | "revoked";
          document_id: string | null;
          last_verified_at: string | null;
          last_verified_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_member_id: string;
          credential_type_id: string;
          business_id: string;
          identifier?: string | null;
          issued_date?: string | null;
          expires_date?: string | null;
          status?: "active" | "expired" | "pending" | "revoked";
          document_id?: string | null;
          last_verified_at?: string | null;
          last_verified_by?: string | null;
          notes?: string | null;
        };
        Update: {
          staff_member_id?: string;
          credential_type_id?: string;
          business_id?: string;
          identifier?: string | null;
          issued_date?: string | null;
          expires_date?: string | null;
          status?: "active" | "expired" | "pending" | "revoked";
          document_id?: string | null;
          last_verified_at?: string | null;
          last_verified_by?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      credential_renewals_log: {
        Row: {
          id: string;
          staff_credential_id: string;
          business_id: string;
          event_kind:
            | "renewed"
            | "reminder_sent"
            | "expired_observed"
            | "verified"
            | "revoked";
          previous_expires_date: string | null;
          new_expires_date: string | null;
          channel: "email" | "sms" | "in_app" | null;
          recipient: string | null;
          notes: string | null;
          recorded_by: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          staff_credential_id: string;
          business_id: string;
          event_kind:
            | "renewed"
            | "reminder_sent"
            | "expired_observed"
            | "verified"
            | "revoked";
          previous_expires_date?: string | null;
          new_expires_date?: string | null;
          channel?: "email" | "sms" | "in_app" | null;
          recipient?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
        };
        Update: {
          event_kind?:
            | "renewed"
            | "reminder_sent"
            | "expired_observed"
            | "verified"
            | "revoked";
          previous_expires_date?: string | null;
          new_expires_date?: string | null;
          channel?: "email" | "sms" | "in_app" | null;
          recipient?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      audit_binders: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          agency: string | null;
          scope: string | null;
          inspection_date: string | null;
          snapshot: Record<string, unknown>;
          share_token_id: string | null;
          status: "draft" | "locked" | "expired";
          locked_at: string | null;
          locked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          agency?: string | null;
          scope?: string | null;
          inspection_date?: string | null;
          snapshot?: Record<string, unknown>;
          share_token_id?: string | null;
          status?: "draft" | "locked" | "expired";
          locked_at?: string | null;
          locked_by?: string | null;
        };
        Update: {
          name?: string;
          agency?: string | null;
          scope?: string | null;
          inspection_date?: string | null;
          snapshot?: Record<string, unknown>;
          share_token_id?: string | null;
          status?: "draft" | "locked" | "expired";
          locked_at?: string | null;
          locked_by?: string | null;
        };
        Relationships: [];
      };
      coi_recipients: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          email: string | null;
          address: string | null;
          requirements: string | null;
          recurring: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          email?: string | null;
          address?: string | null;
          requirements?: string | null;
          recurring?: boolean;
          notes?: string | null;
        };
        Update: {
          name?: string;
          email?: string | null;
          address?: string | null;
          requirements?: string | null;
          recurring?: boolean;
          notes?: string | null;
        };
        Relationships: [];
      };
      coi_issues: {
        Row: {
          id: string;
          business_id: string;
          recipient_id: string;
          document_id: string | null;
          effective_date: string | null;
          expiry_date: string;
          issued_at: string;
          issued_by: string | null;
          delivery_channel: "email" | "share_link" | "manual";
          share_token_id: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          recipient_id: string;
          document_id?: string | null;
          effective_date?: string | null;
          expiry_date: string;
          issued_at?: string;
          issued_by?: string | null;
          delivery_channel?: "email" | "share_link" | "manual";
          share_token_id?: string | null;
          notes?: string | null;
        };
        Update: {
          recipient_id?: string;
          document_id?: string | null;
          effective_date?: string | null;
          expiry_date?: string;
          delivery_channel?: "email" | "share_link" | "manual";
          share_token_id?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          address: string | null;
          jurisdiction_code: string | null;
          customer_name: string | null;
          gc_business_name: string | null;
          start_date: string | null;
          end_date: string | null;
          status: "planned" | "active" | "on_hold" | "completed" | "cancelled";
          value_cents: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          address?: string | null;
          jurisdiction_code?: string | null;
          customer_name?: string | null;
          gc_business_name?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "planned" | "active" | "on_hold" | "completed" | "cancelled";
          value_cents?: number | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          address?: string | null;
          jurisdiction_code?: string | null;
          customer_name?: string | null;
          gc_business_name?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "planned" | "active" | "on_hold" | "completed" | "cancelled";
          value_cents?: number | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      project_deadlines: {
        Row: {
          id: string;
          project_id: string;
          business_id: string;
          name: string;
          description: string | null;
          governing_agency: string | null;
          due_date: string;
          status: "upcoming" | "in_progress" | "compliant" | "overdue";
          severity_tier: "critical" | "high" | "medium" | "low" | "info";
          document_id: string | null;
          source_url: string | null;
          statute_citation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          business_id: string;
          name: string;
          description?: string | null;
          governing_agency?: string | null;
          due_date: string;
          status?: "upcoming" | "in_progress" | "compliant" | "overdue";
          severity_tier?: "critical" | "high" | "medium" | "low" | "info";
          document_id?: string | null;
          source_url?: string | null;
          statute_citation?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          governing_agency?: string | null;
          due_date?: string;
          status?: "upcoming" | "in_progress" | "compliant" | "overdue";
          severity_tier?: "critical" | "high" | "medium" | "low" | "info";
          document_id?: string | null;
          source_url?: string | null;
          statute_citation?: string | null;
        };
        Relationships: [];
      };
      project_documents: {
        Row: {
          id: string;
          project_id: string;
          document_id: string;
          business_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          document_id: string;
          business_id: string;
        };
        Update: { project_id?: string; document_id?: string };
        Relationships: [];
      };
      ce_requirements: {
        Row: {
          id: string;
          credential_type_id: string;
          jurisdiction_code: string | null;
          period_months: number;
          hours_required: number;
          category_breakdown: Record<string, unknown>;
          source_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          credential_type_id: string;
          jurisdiction_code?: string | null;
          period_months: number;
          hours_required: number;
          category_breakdown?: Record<string, unknown>;
          source_url?: string | null;
          notes?: string | null;
        };
        Update: {
          credential_type_id?: string;
          jurisdiction_code?: string | null;
          period_months?: number;
          hours_required?: number;
          category_breakdown?: Record<string, unknown>;
          source_url?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      ce_credits: {
        Row: {
          id: string;
          staff_credential_id: string;
          business_id: string;
          hours: number;
          category: string | null;
          course_name: string | null;
          provider: string | null;
          completed_at: string;
          source_url: string | null;
          document_id: string | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_credential_id: string;
          business_id: string;
          hours: number;
          category?: string | null;
          course_name?: string | null;
          provider?: string | null;
          completed_at: string;
          source_url?: string | null;
          document_id?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
        };
        Update: {
          hours?: number;
          category?: string | null;
          course_name?: string | null;
          provider?: string | null;
          completed_at?: string;
          source_url?: string | null;
          document_id?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_enabled: boolean;
          sms_enabled: boolean;
          phone_number: string | null;
          phone_verified_at: string | null;
          sms_severity_threshold:
            | "critical"
            | "high"
            | "medium"
            | "low"
            | "info";
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          tcpa_opted_in_at: string | null;
          tcpa_opt_in_ip: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_enabled?: boolean;
          sms_enabled?: boolean;
          phone_number?: string | null;
          phone_verified_at?: string | null;
          sms_severity_threshold?:
            | "critical"
            | "high"
            | "medium"
            | "low"
            | "info";
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          tcpa_opted_in_at?: string | null;
          tcpa_opt_in_ip?: string | null;
        };
        Update: {
          email_enabled?: boolean;
          sms_enabled?: boolean;
          phone_number?: string | null;
          phone_verified_at?: string | null;
          sms_severity_threshold?:
            | "critical"
            | "high"
            | "medium"
            | "low"
            | "info";
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          tcpa_opted_in_at?: string | null;
          tcpa_opt_in_ip?: string | null;
        };
        Relationships: [];
      };
      sms_log: {
        Row: {
          id: string;
          user_id: string | null;
          business_id: string | null;
          to_phone: string;
          body: string;
          kind: "reminder" | "verification" | "system";
          provider: "twilio";
          provider_message_id: string | null;
          status: "queued" | "sent" | "delivered" | "failed" | "undelivered";
          cost_cents: number | null;
          error_code: string | null;
          sent_at: string;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          business_id?: string | null;
          to_phone: string;
          body: string;
          kind: "reminder" | "verification" | "system";
          provider?: "twilio";
          provider_message_id?: string | null;
          status?: "queued" | "sent" | "delivered" | "failed" | "undelivered";
          cost_cents?: number | null;
          error_code?: string | null;
          sent_at?: string;
          delivered_at?: string | null;
        };
        Update: {
          status?: "queued" | "sent" | "delivered" | "failed" | "undelivered";
          provider_message_id?: string | null;
          cost_cents?: number | null;
          error_code?: string | null;
          delivered_at?: string | null;
        };
        Relationships: [];
      };
      business_associate_agreements: {
        Row: {
          id: string;
          business_id: string;
          version: string;
          signed_at: string;
          signed_by_user_id: string | null;
          signer_name: string;
          signer_title: string | null;
          signer_ip: string | null;
          pdf_document_id: string | null;
          effective_until: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          version: string;
          signed_at: string;
          signed_by_user_id?: string | null;
          signer_name: string;
          signer_title?: string | null;
          signer_ip?: string | null;
          pdf_document_id?: string | null;
          effective_until?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          version?: string;
          signed_at?: string;
          signer_name?: string;
          signer_title?: string | null;
          signer_ip?: string | null;
          pdf_document_id?: string | null;
          effective_until?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      phi_access_log: {
        Row: {
          id: string;
          business_id: string;
          user_id: string | null;
          accountant_connection_id: string | null;
          share_token_id: string | null;
          document_id: string | null;
          deadline_id: string | null;
          staff_credential_id: string | null;
          action: "view" | "download" | "list" | "share" | "export" | "create" | "update" | "delete";
          ip: string | null;
          user_agent: string | null;
          accessed_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id?: string | null;
          accountant_connection_id?: string | null;
          share_token_id?: string | null;
          document_id?: string | null;
          deadline_id?: string | null;
          staff_credential_id?: string | null;
          action: "view" | "download" | "list" | "share" | "export" | "create" | "update" | "delete";
          ip?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: "view" | "download" | "list" | "share" | "export" | "create" | "update" | "delete";
          ip?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      filings: {
        Row: {
          id: string;
          business_id: string;
          deadline_id: string | null;
          filing_kind:
            | "state_annual_report"
            | "fincen_boi"
            | "de_franchise_tax"
            | "business_license_renewal"
            | "food_handler"
            | "liquor_renewal";
          provider: "harbor_compliance" | "license_logix" | "direct";
          partner_filing_id: string | null;
          status:
            | "pending"
            | "submitted"
            | "accepted"
            | "rejected"
            | "refunded"
            | "failed";
          price_cents: number;
          cost_cents: number | null;
          stripe_payment_intent_id: string | null;
          filed_at: string | null;
          confirmation_number: string | null;
          return_document_id: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          deadline_id?: string | null;
          filing_kind:
            | "state_annual_report"
            | "fincen_boi"
            | "de_franchise_tax"
            | "business_license_renewal"
            | "food_handler"
            | "liquor_renewal";
          provider: "harbor_compliance" | "license_logix" | "direct";
          partner_filing_id?: string | null;
          status?:
            | "pending"
            | "submitted"
            | "accepted"
            | "rejected"
            | "refunded"
            | "failed";
          price_cents: number;
          cost_cents?: number | null;
          stripe_payment_intent_id?: string | null;
          filed_at?: string | null;
          confirmation_number?: string | null;
          return_document_id?: string | null;
          created_by?: string | null;
        };
        Update: {
          status?:
            | "pending"
            | "submitted"
            | "accepted"
            | "rejected"
            | "refunded"
            | "failed";
          partner_filing_id?: string | null;
          filed_at?: string | null;
          confirmation_number?: string | null;
          return_document_id?: string | null;
        };
        Relationships: [];
      };
      integration_connections: {
        Row: {
          id: string;
          business_id: string;
          provider: "simplepractice" | "karbon" | "qbo" | "taxdome";
          external_account_id: string | null;
          access_token_cipher: string | null;
          refresh_token_cipher: string | null;
          token_expires_at: string | null;
          scopes: string[];
          status: "active" | "paused" | "revoked" | "errored";
          last_synced_at: string | null;
          last_sync_error_at: string | null;
          last_sync_error: string | null;
          connected_by: string | null;
          connected_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          provider: "simplepractice" | "karbon" | "qbo" | "taxdome";
          external_account_id?: string | null;
          access_token_cipher?: string | null;
          refresh_token_cipher?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          status?: "active" | "paused" | "revoked" | "errored";
          last_synced_at?: string | null;
          last_sync_error_at?: string | null;
          last_sync_error?: string | null;
          connected_by?: string | null;
        };
        Update: {
          external_account_id?: string | null;
          access_token_cipher?: string | null;
          refresh_token_cipher?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          status?: "active" | "paused" | "revoked" | "errored";
          last_synced_at?: string | null;
          last_sync_error_at?: string | null;
          last_sync_error?: string | null;
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
        Args: {
          p_key: string;
          p_max_attempts: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      cleanup_auth_rate_limits: {
        Args: Record<string, never>;
        Returns: void;
      };
      accept_correction: {
        Args: { p_correction_id: string };
        Returns: string;
      };
      reject_correction: {
        Args: { p_correction_id: string; p_review_note: string };
        Returns: void;
      };
      version_regulatory_rule: {
        Args: { p_rule_id: string; p_changes: Record<string, unknown> };
        Returns: string;
      };
      refresh_rule_confidence: {
        Args: Record<string, never>;
        Returns: void;
      };
      refresh_industry_benchmarks: {
        Args: Record<string, never>;
        Returns: void;
      };
      complete_onboarding: {
        Args: {
          p_business: Record<string, unknown>;
          p_location: Record<string, unknown>;
          p_seeds: Array<Record<string, unknown>>;
        };
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
