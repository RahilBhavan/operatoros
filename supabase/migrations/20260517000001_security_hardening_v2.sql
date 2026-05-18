-- Security hardening pass:
--   1. Drop exploitable anon RLS policies on share_tokens / businesses / deadlines.
--      The /share/[token] route reads via service-role (loadShareViewByToken in
--      src/lib/security/share-by-token.ts), so anon SELECT on these tables is
--      unnecessary. Leaving them open lets any holder of the public anon key
--      run `select * from share_tokens` and harvest every active token.
--   2. Pin SET search_path = '' on every SECURITY DEFINER function so a public-
--      schema function-name collision cannot shadow the intended target. All
--      function bodies are already public-qualified, so this is no-op behaviorally
--      and Postgres still searches pg_catalog implicitly for built-ins (now(),
--      encode(), gen_random_bytes()).
--   3. Add FK indexes on deadlines.business_id, locations.business_id,
--      documents.business_id. Every RLS policy on these tables joins through
--      business_id; Postgres auto-indexes PKs but never FKs.

-- ── 1. Anon-policy lockdown ────────────────────────────────────────────────
drop policy if exists "Anyone can read share tokens" on public.share_tokens;
drop policy if exists "Anon can read shared business info" on public.businesses;
drop policy if exists "Anon can read shared deadlines" on public.deadlines;

-- ── 2. Pin search_path on every SECURITY DEFINER function ──────────────────
alter function public.is_platform_admin()
  set search_path = '';

alter function public.claim_platform_admin_invite(text, text)
  set search_path = '';

alter function public.record_share_view(text, text, text)
  set search_path = '';

alter function public.unsubscribe_reminders(text)
  set search_path = '';

alter function public.try_consume_ai_rate_limit(integer, interval)
  set search_path = '';

alter function public.try_consume_auth_rate_limit(text, integer, integer)
  set search_path = '';

alter function public.complete_onboarding(jsonb, jsonb, jsonb)
  set search_path = '';

alter function public.version_regulatory_rule(uuid, jsonb)
  set search_path = '';

alter function public.refresh_industry_benchmarks()
  set search_path = '';

-- corrections_loop migration (20260516000008) added three more
alter function public.refresh_rule_confidence()
  set search_path = '';

alter function public.accept_correction(uuid)
  set search_path = '';

alter function public.reject_correction(uuid, text)
  set search_path = '';

-- ── 3. FK indexes on tenant-scoped tables ──────────────────────────────────
create index if not exists deadlines_business_id_idx
  on public.deadlines (business_id);

create index if not exists locations_business_id_idx
  on public.locations (business_id);

create index if not exists documents_business_id_idx
  on public.documents (business_id);
