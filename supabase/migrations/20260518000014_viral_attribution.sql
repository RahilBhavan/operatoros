-- WS-D — Viral attribution: accountants invite SMBs via tracked codes; the
-- resulting businesses are linked back to the accountant; payments increment
-- a paid_conversions_count so the accountant can see MRR they've sourced.
--
-- Schema notes:
--   • businesses.invited_by_accountant_id references auth.users — accountants
--     have first-class auth (plan_tier='accountant'). The column is nullable
--     so legacy + self-serve signups stay valid.
--   • accountant_invite_links is owned by the accountant; RLS lets the
--     accountant read/write their own links, lets admins do anything, and
--     stays opaque to other users.
--   • Counters (signups_count, paid_conversions_count) are incremented by
--     server-side service-role code (onboarding action + Stripe webhook).
--     Service role bypasses RLS so no separate increment RPC is needed.
--   • Lookup by `code` is the hot path (every /i/<code> hit) — uniqueness +
--     a partial index over non-revoked rows covers it.

-- ─── businesses columns ─────────────────────────────────────────────────

alter table public.businesses
  add column if not exists invited_by_accountant_id uuid
    references auth.users(id) on delete set null;

alter table public.businesses
  add column if not exists invite_code text;

create index if not exists businesses_invited_by_accountant_idx
  on public.businesses (invited_by_accountant_id)
  where invited_by_accountant_id is not null;

-- ─── accountant_invite_links ────────────────────────────────────────────

create table if not exists public.accountant_invite_links (
  id uuid primary key default gen_random_uuid(),
  accountant_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  label text check (label is null or char_length(label) <= 120),
  signups_count integer not null default 0,
  paid_conversions_count integer not null default 0,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists accountant_invite_links_code_key
  on public.accountant_invite_links (code);

create index if not exists accountant_invite_links_accountant_idx
  on public.accountant_invite_links (accountant_id)
  where revoked_at is null;

alter table public.accountant_invite_links enable row level security;

drop policy if exists accountant_invite_links_select_own
  on public.accountant_invite_links;
create policy accountant_invite_links_select_own
  on public.accountant_invite_links
  for select
  to authenticated
  using (accountant_id = auth.uid());

drop policy if exists accountant_invite_links_insert_own
  on public.accountant_invite_links;
create policy accountant_invite_links_insert_own
  on public.accountant_invite_links
  for insert
  to authenticated
  with check (accountant_id = auth.uid());

drop policy if exists accountant_invite_links_update_own
  on public.accountant_invite_links;
create policy accountant_invite_links_update_own
  on public.accountant_invite_links
  for update
  to authenticated
  using (accountant_id = auth.uid())
  with check (accountant_id = auth.uid());

-- Admin override: platform admins see everything (used by /admin and
-- cross-tenant rescue flows). Mirrors the pattern used on platform_admins.
drop policy if exists accountant_invite_links_admin_all
  on public.accountant_invite_links;
create policy accountant_invite_links_admin_all
  on public.accountant_invite_links
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
