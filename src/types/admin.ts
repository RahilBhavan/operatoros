// Surfaced types for the admin dashboard. Kept here so DB type generation can
// regenerate `types/supabase.ts` without losing these app-level views.

export type BusinessSummary = {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string | null;
  plan_tier: "free" | "lite" | "business" | "accountant";
  billing_status: "trialing" | "active" | "past_due" | "canceled" | "inactive";
  trial_ends_at: string | null;
  created_at: string;
  state: string | null;
  industry_slug: string | null;
  entity_type: string | null;
  employee_count: number | null;
  deadline_count: number;
  overdue_count: number;
  risk_weighted_score: number;
  exposure_cents: number;
};

export type WaitlistRow = {
  id: string;
  email: string;
  state: string | null;
  industry_slug: string | null;
  signed_up_at: string;
  utm_source: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  referral_code: string;
  referred_by_code: string | null;
  confirmation_sent_at: string | null;
  invited_at: string | null;
};

export type AuditEventRow = {
  id: string;
  business_id: string | null;
  business_name: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  event_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
};
