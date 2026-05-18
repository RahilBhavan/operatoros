-- WS-1.2 — Audit-prep mode. A discrete workflow that pulls together a binder
-- for an inbound surveyor / inspector / auditor visit: deadlines for the
-- target agency, supporting documents, optional score snapshot, and a
-- date-locked share link with a read-only banner.
--
-- ~7 personas in the panel (ALF, daycare, dental, home health, mental
-- health, body shop, dispensary) cited this as their highest-WTP workflow.
--
-- Schema notes:
--   • Snapshots are immutable once locked. We capture the included deadline
--     IDs in a JSONB column so post-survey edits to deadlines don't change
--     what the surveyor saw.
--   • Each binder is paired 1:1 with a share_token (existing infra) — the
--     surveyor-facing URL is /share/[token] with an audit-binder banner.
--   • binder_status: draft → locked → expired. Lock is permanent.

create table if not exists public.audit_binders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  agency text check (agency is null or char_length(agency) <= 200),
  scope text check (scope is null or char_length(scope) <= 4000),
  inspection_date date,
  snapshot jsonb not null default '{}'::jsonb,
  share_token_id uuid references public.share_tokens(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'locked', 'expired')),
  locked_at timestamptz,
  locked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audit_binders_business_idx
  on public.audit_binders (business_id, created_at desc);

create index if not exists audit_binders_share_token_idx
  on public.audit_binders (share_token_id)
  where share_token_id is not null;

alter table public.audit_binders enable row level security;

drop policy if exists audit_binders_select on public.audit_binders;
create policy audit_binders_select
  on public.audit_binders for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = audit_binders.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists audit_binders_write on public.audit_binders;
create policy audit_binders_write
  on public.audit_binders for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = audit_binders.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = audit_binders.business_id
        and b.owner_id = auth.uid()
    )
  );

create or replace function public.touch_audit_binders_updated_at()
returns trigger
language plpgsql
as $$
begin
  -- Once locked, only metadata can change (e.g., share_token_id rotation).
  -- The snapshot column itself is enforced at app-write time.
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists audit_binders_updated_at on public.audit_binders;
create trigger audit_binders_updated_at
  before update on public.audit_binders
  for each row execute function public.touch_audit_binders_updated_at();
