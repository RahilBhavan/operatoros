-- WS-4.1 — Filings-as-a-service (H4). One row per "OperatorOS files this
-- for me" purchase. The provider field anchors to the partner who actually
-- files (Harbor Compliance, LicenseLogix, or a state-direct integration);
-- price_cents is the OS-side margin-included price; cost_cents tracks the
-- partner's wholesale cost.
--
-- The partner_filing_id is the external reference for status polling.
-- Until partner agreements land, this schema is unused at runtime — the
-- "File this for me" UI on a deadline-detail page surfaces the price but
-- routes to a "coming soon" state.

create table if not exists public.filings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  deadline_id uuid references public.deadlines(id) on delete set null,
  filing_kind text not null check (
    filing_kind in (
      'state_annual_report',
      'fincen_boi',
      'de_franchise_tax',
      'business_license_renewal',
      'food_handler',
      'liquor_renewal'
    )
  ),
  provider text not null check (
    provider in ('harbor_compliance', 'license_logix', 'direct')
  ),
  partner_filing_id text,
  status text not null default 'pending' check (
    status in (
      'pending',
      'submitted',
      'accepted',
      'rejected',
      'refunded',
      'failed'
    )
  ),
  price_cents integer not null check (price_cents >= 0),
  cost_cents integer check (cost_cents is null or cost_cents >= 0),
  stripe_payment_intent_id text,
  filed_at timestamptz,
  confirmation_number text,
  return_document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists filings_business_idx
  on public.filings (business_id, created_at desc);

create index if not exists filings_deadline_idx
  on public.filings (deadline_id)
  where deadline_id is not null;

create index if not exists filings_status_idx
  on public.filings (status, created_at desc)
  where status in ('pending', 'submitted');

alter table public.filings enable row level security;

drop policy if exists filings_select on public.filings;
create policy filings_select
  on public.filings for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = filings.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists filings_insert on public.filings;
create policy filings_insert
  on public.filings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = filings.business_id
        and b.owner_id = auth.uid()
    )
  );

-- Admin/service-role updates the filing row as partner status changes.
drop policy if exists filings_admin_update on public.filings;
create policy filings_admin_update
  on public.filings for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create or replace function public.touch_filings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists filings_updated_at on public.filings;
create trigger filings_updated_at
  before update on public.filings
  for each row execute function public.touch_filings_updated_at();
