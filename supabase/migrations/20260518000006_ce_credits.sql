-- WS-2.3 — CE/CEU tracking per practitioner. Builds on WS-2.1 staff
-- credentials. ~7 personas (mental health LCSW across 4 states, dermatology,
-- optometry, CPAs, insurance agents, RE brokers, architects, engineers,
-- funeral home directors) explicitly named CE tracking as kill-pain.
--
-- Schema notes:
--   • ce_requirements references credential_types so the requirement
--     applies "everywhere this credential is held." Per-state overrides
--     can use jurisdiction_code.
--   • ce_credits joins to staff_credentials so a credit accrues against a
--     specific person's specific credential instance.

create table if not exists public.ce_requirements (
  id uuid primary key default gen_random_uuid(),
  credential_type_id uuid not null references public.credential_types(id) on delete cascade,
  jurisdiction_code text,
  period_months integer not null check (period_months between 1 and 240),
  hours_required numeric(6, 2) not null check (hours_required >= 0),
  category_breakdown jsonb not null default '{}'::jsonb,
  source_url text check (source_url is null or char_length(source_url) <= 2000),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (credential_type_id, jurisdiction_code)
);

create index if not exists ce_requirements_credential_idx
  on public.ce_requirements (credential_type_id);

alter table public.ce_requirements enable row level security;

drop policy if exists ce_requirements_read on public.ce_requirements;
create policy ce_requirements_read
  on public.ce_requirements for select
  to authenticated
  using (true);

drop policy if exists ce_requirements_admin_write on public.ce_requirements;
create policy ce_requirements_admin_write
  on public.ce_requirements for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ─── ce_credits ──────────────────────────────────────────────────────────

create table if not exists public.ce_credits (
  id uuid primary key default gen_random_uuid(),
  staff_credential_id uuid not null references public.staff_credentials(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  hours numeric(6, 2) not null check (hours >= 0),
  category text check (category is null or char_length(category) <= 100),
  course_name text check (course_name is null or char_length(course_name) <= 200),
  provider text check (provider is null or char_length(provider) <= 200),
  completed_at date not null,
  source_url text check (source_url is null or char_length(source_url) <= 2000),
  document_id uuid references public.documents(id) on delete set null,
  notes text check (notes is null or char_length(notes) <= 4000),
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ce_credits_credential_idx
  on public.ce_credits (staff_credential_id, completed_at desc);

create index if not exists ce_credits_business_idx
  on public.ce_credits (business_id, completed_at desc);

alter table public.ce_credits enable row level security;

drop policy if exists ce_credits_select on public.ce_credits;
create policy ce_credits_select
  on public.ce_credits for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = ce_credits.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists ce_credits_write on public.ce_credits;
create policy ce_credits_write
  on public.ce_credits for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = ce_credits.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = ce_credits.business_id
        and b.owner_id = auth.uid()
    )
  );
