-- WS-3.1 — COI generation + auto-distribution. ~11 construction + service
-- personas in the panel cited this as the single biggest workflow ask
-- ("COI per job per GC is the workflow I'd pay extra for").
--
-- Initial scope is manual: the user uploads a master COI PDF, lists named
-- additional insureds, OperatorOS handles distribution + expiry tracking.
-- Carrier-API generation (auto-issue ACORD 25) is a v2 deferred to H4 since
-- it requires per-carrier integrations.
--
-- Schema notes:
--   • coi_recipients are the GCs / HOAs / property managers a business
--     regularly sends certificates to. Recurring boolean drives "auto-send
--     each renewal" behavior.
--   • coi_issues logs one row per distribution event — which recipient
--     received which PDF on which date, with what expiry.

create table if not exists public.coi_recipients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  email text check (email is null or char_length(email) <= 320),
  address text check (address is null or char_length(address) <= 1000),
  requirements text check (requirements is null or char_length(requirements) <= 4000),
  recurring boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coi_recipients_business_idx
  on public.coi_recipients (business_id, name);

alter table public.coi_recipients enable row level security;

drop policy if exists coi_recipients_select on public.coi_recipients;
create policy coi_recipients_select
  on public.coi_recipients for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = coi_recipients.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists coi_recipients_write on public.coi_recipients;
create policy coi_recipients_write
  on public.coi_recipients for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = coi_recipients.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = coi_recipients.business_id
        and b.owner_id = auth.uid()
    )
  );

create or replace function public.touch_coi_recipients_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists coi_recipients_updated_at on public.coi_recipients;
create trigger coi_recipients_updated_at
  before update on public.coi_recipients
  for each row execute function public.touch_coi_recipients_updated_at();

-- ─── coi_issues ──────────────────────────────────────────────────────────

create table if not exists public.coi_issues (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  recipient_id uuid not null references public.coi_recipients(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  effective_date date,
  expiry_date date not null,
  issued_at timestamptz not null default now(),
  issued_by uuid references auth.users(id) on delete set null,
  delivery_channel text not null default 'email' check (
    delivery_channel in ('email', 'share_link', 'manual')
  ),
  share_token_id uuid references public.share_tokens(id) on delete set null,
  notes text check (notes is null or char_length(notes) <= 4000)
);

create index if not exists coi_issues_recipient_idx
  on public.coi_issues (recipient_id, expiry_date desc);

create index if not exists coi_issues_business_idx
  on public.coi_issues (business_id, expiry_date desc);

create index if not exists coi_issues_expiry_idx
  on public.coi_issues (expiry_date)
  where expiry_date is not null;

alter table public.coi_issues enable row level security;

drop policy if exists coi_issues_select on public.coi_issues;
create policy coi_issues_select
  on public.coi_issues for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = coi_issues.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists coi_issues_insert on public.coi_issues;
create policy coi_issues_insert
  on public.coi_issues for insert
  to authenticated
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = coi_issues.business_id
        and b.owner_id = auth.uid()
    )
  );
