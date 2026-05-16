-- Allow audit_events for platform-level actions (not tied to a tenant).
-- The owner-read policy already filters by business_id IN owned businesses,
-- and NULL won't match that predicate, so making business_id nullable does
-- not leak platform events to customers. Service-role inserts only.
ALTER TABLE public.audit_events ALTER COLUMN business_id DROP NOT NULL;

-- Make actor_user_id NOT NULL for platform events (we always know who did
-- the action) — but keep nullable to preserve legacy rows.
-- (No change; just documenting intent.)

CREATE INDEX IF NOT EXISTS idx_audit_events_platform
  ON public.audit_events (occurred_at DESC) WHERE business_id IS NULL;
