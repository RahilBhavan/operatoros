-- Workstream B: accountant corrections loop.
--
-- Every $299 accountant on the platform can flag a rule as wrong, suggest a
-- correction (with citation), and watch it flow through admin review into
-- the canonical graph. Each rule gets a confidence tier derived from the
-- corrections history + last_verified_at. Business-side deadlines surface
-- the confidence inline.
--
-- Schema notes:
--   • Accountants in this codebase do NOT auth through Supabase — they hold
--     an accountant_connections.token. So `proposed_by_connection_id` is the
--     primary identity for accountant-submitted corrections; `proposed_by_user_id`
--     is used for admin/business_member submissions. A CHECK enforces at
--     least one is present.
--   • status moves pending → (accepted|rejected). 'superseded' is reserved
--     for the future case where a newer correction obsoletes a pending one.
--   • resulting_rule_id is populated on accept and points at the new
--     regulatory_rules row that the accept RPC forked (via
--     version_regulatory_rule, which is the same RPC the admin edit path
--     uses — so the v+1 lifecycle is uniform regardless of who proposed
--     the change).
--   • rule_confidence is a MATERIALIZED VIEW with a unique index on rule_id
--     so `refresh materialized view concurrently` works. The accept RPC
--     does NOT refresh the view — the API route does, after commit, to keep
--     the heavy refresh out of the user-visible transaction. The refresh
--     function is granted to service_role only; an Edge cron refreshes
--     hourly as a backstop.

create table if not exists public.rule_corrections (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.regulatory_rules(id) on delete cascade,
  proposed_by_connection_id uuid references public.accountant_connections(id) on delete set null,
  proposed_by_user_id uuid references auth.users(id) on delete set null,
  proposed_by_kind text not null check (proposed_by_kind in ('accountant','admin','business_member')),
  proposed_changes jsonb not null,
  rationale text not null check (char_length(rationale) >= 8 and char_length(rationale) <= 4000),
  citation_url text check (citation_url is null or char_length(citation_url) <= 2000),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','superseded')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 2000),
  resulting_rule_id uuid references public.regulatory_rules(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint rule_corrections_proposer_present
    check (
      proposed_by_connection_id is not null
      or proposed_by_user_id is not null
    )
);

create index if not exists rule_corrections_status_pending_idx
  on public.rule_corrections (created_at desc)
  where status = 'pending';

create index if not exists rule_corrections_by_rule_idx
  on public.rule_corrections (rule_id, status);

create index if not exists rule_corrections_by_connection_idx
  on public.rule_corrections (proposed_by_connection_id, created_at desc)
  where proposed_by_connection_id is not null;

alter table public.rule_corrections enable row level security;

-- Lock everything down to admins. Accountant submissions arrive via the
-- API route using the service-role client (token-scoped, rate-limited),
-- which bypasses RLS — so the admin-only policy is defense-in-depth.
drop policy if exists rule_corrections_admin_read on public.rule_corrections;
create policy rule_corrections_admin_read
  on public.rule_corrections for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists rule_corrections_admin_write on public.rule_corrections;
create policy rule_corrections_admin_write
  on public.rule_corrections for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Per-rule confidence tier. Derived from corrections history + verification
-- age. Materialized so dashboard reads don't aggregate corrections on every
-- request; refreshed by the API route after each accept/reject + by an
-- hourly cron as backstop. Limited to rules that are the head of their
-- chain (not superseded, not sunset).
drop materialized view if exists public.rule_confidence;

create materialized view public.rule_confidence as
select
  r.id as rule_id,
  case
    when count(c.*) filter (where c.status = 'rejected') > 2 then 'low'
    when r.last_verified_at is null then 'unverified'
    when r.last_verified_at < now() - interval '180 days' then 'stale'
    when count(c.*) filter (where c.status = 'accepted') >= 1 then 'community_validated'
    else 'baseline'
  end as confidence_tier,
  count(c.*) filter (where c.status = 'accepted') as accepted_corrections,
  count(c.*) filter (where c.status = 'pending')  as pending_corrections,
  count(c.*) filter (where c.status = 'rejected') as rejected_corrections,
  r.last_verified_at
from public.regulatory_rules r
left join public.rule_corrections c on c.rule_id = r.id
where r.sunset_date is null
  and r.superseded_by is null
group by r.id, r.last_verified_at;

create unique index rule_confidence_pk on public.rule_confidence (rule_id);

-- Materialized views don't honour table RLS; instead we revoke broadly and
-- grant SELECT to authenticated. The view exposes only aggregates + tier
-- (no PII, no rationale text), so this is intentional.
revoke all on public.rule_confidence from public, anon;
grant select on public.rule_confidence to authenticated;

-- Refresh function (service-role only). `concurrently` requires the unique
-- index above and an exclusive lock only on a small system catalog row, so
-- it doesn't block reads on the view.
create or replace function public.refresh_rule_confidence()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.rule_confidence;
end;
$$;

revoke all on function public.refresh_rule_confidence() from public, anon, authenticated;
grant execute on function public.refresh_rule_confidence() to service_role;

-- accept_correction(p_correction_id):
--   • admin-only (via is_platform_admin())
--   • FOR UPDATE on the correction row so two admins clicking Accept
--     simultaneously serialise; the second one sees a non-pending row and
--     raises correction_already_resolved (SQLSTATE 22023 — same shape as
--     the version-already-superseded error from the edit path, so callers
--     can handle both with one branch).
--   • calls version_regulatory_rule(rule_id, proposed_changes) inside the
--     same transaction — same RPC the admin edit path uses, so the v+1
--     lifecycle is uniform.
--   • upserts a regulatory_rule_sources row crediting the correction.
--     (version_regulatory_rule itself writes a source row with
--     source_kind='admin_edit'; we add an 'accountant_correction' row
--     pointing at the correction so provenance shows BOTH the admin and
--     the proposing accountant.)
--   • updates correction.status='accepted', stamps reviewer, links the
--     new rule.
--   • returns the new rule_id.
create or replace function public.accept_correction(
  p_correction_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_correction public.rule_corrections%rowtype;
  v_new_rule_id uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_correction
    from public.rule_corrections
   where id = p_correction_id
   for update;

  if not found then
    raise exception 'correction not found' using errcode = 'P0002';
  end if;

  if v_correction.status <> 'pending' then
    raise exception 'correction already resolved' using errcode = '22023';
  end if;

  -- Fork a new version of the rule via the shared versioning RPC.
  -- Any error from version_regulatory_rule (rule already superseded,
  -- not found, etc.) propagates and rolls back the correction update.
  v_new_rule_id := public.version_regulatory_rule(
    v_correction.rule_id,
    v_correction.proposed_changes
  );

  -- Extra provenance: credit the accountant correction too. The
  -- versioning RPC already inserted an 'admin_edit' row pointing at
  -- the prior rule_id; this row points at the correction id.
  insert into public.regulatory_rule_sources (rule_id, source_kind, source_ref)
  values (v_new_rule_id, 'accountant_correction', p_correction_id::text);

  update public.rule_corrections
     set status = 'accepted',
         reviewed_by = v_user,
         reviewed_at = now(),
         resulting_rule_id = v_new_rule_id
   where id = p_correction_id;

  return v_new_rule_id;
end;
$$;

revoke all on function public.accept_correction(uuid) from public, anon;
grant execute on function public.accept_correction(uuid) to authenticated;

-- reject_correction(p_correction_id, p_review_note):
--   • admin-only
--   • FOR UPDATE serialises concurrent reviewers (same shape as accept)
--   • does NOT touch the rule graph
create or replace function public.reject_correction(
  p_correction_id uuid,
  p_review_note text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_correction public.rule_corrections%rowtype;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_review_note is null or char_length(trim(p_review_note)) = 0 then
    raise exception 'review_note required' using errcode = '22023';
  end if;

  select * into v_correction
    from public.rule_corrections
   where id = p_correction_id
   for update;

  if not found then
    raise exception 'correction not found' using errcode = 'P0002';
  end if;

  if v_correction.status <> 'pending' then
    raise exception 'correction already resolved' using errcode = '22023';
  end if;

  update public.rule_corrections
     set status = 'rejected',
         reviewed_by = v_user,
         reviewed_at = now(),
         review_note = p_review_note
   where id = p_correction_id;
end;
$$;

revoke all on function public.reject_correction(uuid, text) from public, anon;
grant execute on function public.reject_correction(uuid, text) to authenticated;

-- Initial refresh so the view has rows immediately after migration apply.
-- Subsequent refreshes go through refresh_rule_confidence().
refresh materialized view public.rule_confidence;
