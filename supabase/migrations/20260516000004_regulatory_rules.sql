-- Workstream A: regulatory rule graph.
--
-- Tables for the canonical, versioned, citation-backed regulatory rule set.
-- Today the seed engine reads from an in-memory mirror in regulatory-graph.ts
-- (LEGACY_RULES) because onboarding's server action is synchronous; this
-- table is the source of truth for admin editing + the corrections loop
-- (Workstream B). A subsequent workstream re-points the seed engine at
-- this table at runtime.
--
-- Schema notes:
--   • (jurisdiction_code, industry_slug, rule_key, version) is unique so
--     successive versions of the same rule coexist.
--   • superseded_by chains versions; the lookup index excludes superseded
--     rows so consumers see only the current canonical row per (jurisdiction,
--     industry, rule_key).
--   • last_verified_at/by tracks "an admin has eyeballed this rule against
--     the agency source on this date" — the basis for the confidence tier
--     in Workstream B.
--   • applies_when is a small JSON shape (entityType set, hasEmployees,
--     hiresContractors, employeeCountMin) so the same rule row works for
--     the engine's filter step without hardcoding selectors into SQL.

create table if not exists public.regulatory_rules (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_type text not null check (jurisdiction_type in ('federal','state','local')),
  jurisdiction_code text not null,
  industry_slug text,
  rule_key text not null,
  name text not null,
  description text not null,
  deadline_type text not null,
  governing_agency text not null,
  frequency text not null,
  due_date_rule jsonb not null,
  applies_when jsonb not null default '{}'::jsonb,
  severity_tier text not null check (severity_tier in ('critical','high','medium','low','info')),
  penalty_estimate_cents bigint,
  source_url text,
  statute_citation text,
  effective_date date not null default '2000-01-01',
  sunset_date date,
  version integer not null default 1,
  superseded_by uuid references public.regulatory_rules(id),
  last_verified_at timestamptz,
  last_verified_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jurisdiction_code, industry_slug, rule_key, version)
);

create index if not exists regulatory_rules_lookup_idx
  on public.regulatory_rules (jurisdiction_code, industry_slug, frequency)
  where superseded_by is null and sunset_date is null;

create index if not exists regulatory_rules_unverified_idx
  on public.regulatory_rules (jurisdiction_code)
  where last_verified_at is null and superseded_by is null;

create index if not exists regulatory_rules_stale_idx
  on public.regulatory_rules (last_verified_at)
  where superseded_by is null;

-- Provenance of how each row got here. The seed migration inserts a
-- ('seed', null) row per rule; the corrections loop will insert
-- ('accountant_correction', correction_id) rows.
create table if not exists public.regulatory_rule_sources (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.regulatory_rules(id) on delete cascade,
  source_kind text not null check (source_kind in ('seed','accountant_correction','admin_edit','agency_scrape')),
  source_ref text,
  created_at timestamptz not null default now()
);

create index if not exists regulatory_rule_sources_rule_idx
  on public.regulatory_rule_sources (rule_id);

-- Trigger keeps updated_at honest. The verify endpoint also touches
-- last_verified_at directly; that's fine — updated_at moves on any change.
create or replace function public.touch_regulatory_rules_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists regulatory_rules_updated_at on public.regulatory_rules;
create trigger regulatory_rules_updated_at
  before update on public.regulatory_rules
  for each row execute function public.touch_regulatory_rules_updated_at();

-- RLS: every authenticated user can SELECT (the rule graph is public knowledge
-- once you have an account — agency rules, statutes, due dates are not PII).
-- Mutation is locked to platform admins only; admin writes go via the
-- service-role client which bypasses RLS, but the policy makes the intent
-- explicit and protects against an authenticated-key misuse.
alter table public.regulatory_rules enable row level security;
alter table public.regulatory_rule_sources enable row level security;

drop policy if exists regulatory_rules_read on public.regulatory_rules;
create policy regulatory_rules_read
  on public.regulatory_rules for select
  to authenticated
  using (true);

drop policy if exists regulatory_rules_admin_write on public.regulatory_rules;
create policy regulatory_rules_admin_write
  on public.regulatory_rules for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists regulatory_rule_sources_read on public.regulatory_rule_sources;
create policy regulatory_rule_sources_read
  on public.regulatory_rule_sources for select
  to authenticated
  using (true);

drop policy if exists regulatory_rule_sources_admin_write on public.regulatory_rule_sources;
create policy regulatory_rule_sources_admin_write
  on public.regulatory_rule_sources for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Link each materialised deadline back to its source rule UUID. The
-- existing deadlines.rule_id is text (the LEGACY_RULE_KEY string); this
-- new column is the FK into regulatory_rules for the corrections loop to
-- propagate updates against. Nullable so manually-created deadlines
-- (rule_id text IS NULL) stay nullable here too.
alter table public.deadlines
  add column if not exists regulatory_rule_id uuid references public.regulatory_rules(id);

create index if not exists deadlines_regulatory_rule_idx
  on public.deadlines (regulatory_rule_id)
  where regulatory_rule_id is not null;
