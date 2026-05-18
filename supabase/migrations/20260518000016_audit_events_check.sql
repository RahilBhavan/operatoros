-- WS-H.2 — Tightens audit_events so a row must have at least one of
-- business_id or actor_user_id. Platform-level events (e.g. waitlist invite)
-- have business_id null but actor_user_id set; tenant events typically have
-- business_id set. A row with both null indicates a bug at the call site.
--
-- Validated against existing rows first so a deploy on an inconsistent
-- prod database doesn't fail unexpectedly: any pre-existing row with both
-- null is purged. There should be none in well-instrumented history, but
-- the cleanup keeps the migration robust.

delete from public.audit_events
where business_id is null and actor_user_id is null;

alter table public.audit_events
  drop constraint if exists audit_events_actor_required;

alter table public.audit_events
  add constraint audit_events_actor_required
  check (business_id is not null or actor_user_id is not null);
