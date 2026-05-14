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
        };
        Insert: {
          id?: string;
          email: string;
          signed_up_at?: string;
          source?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          signed_up_at?: string;
          source?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          industry_sic_code: string | null;
          entity_type: string | null;
          employee_count: number | null;
          hires_contractors: boolean;
          created_at: string;
          onboarding_complete: boolean;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan_tier: "free" | "starter" | "growth" | "scale";
          billing_status: "trialing" | "active" | "past_due" | "canceled" | "inactive";
          trial_ends_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          industry_sic_code?: string | null;
          entity_type?: string | null;
          employee_count?: number | null;
          hires_contractors?: boolean;
          created_at?: string;
          onboarding_complete?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_tier?: "free" | "starter" | "growth" | "scale";
          billing_status?: "trialing" | "active" | "past_due" | "canceled" | "inactive";
          trial_ends_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          industry_sic_code?: string | null;
          entity_type?: string | null;
          employee_count?: number | null;
          hires_contractors?: boolean;
          created_at?: string;
          onboarding_complete?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_tier?: "free" | "starter" | "growth" | "scale";
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
        };
        Insert: {
          id?: string;
          deadline_id: string;
          business_id: string;
          reminder_type: "90_day" | "60_day" | "30_day" | "7_day" | "1_day";
          sent_at?: string;
          recipient_email: string;
        };
        Update: {
          id?: string;
          deadline_id?: string;
          business_id?: string;
          reminder_type?: "90_day" | "60_day" | "30_day" | "7_day" | "1_day";
          sent_at?: string;
          recipient_email?: string;
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
        };
        Insert: {
          id?: string;
          business_id: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
