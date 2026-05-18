-- WS-2.1 — Per-staff credential tracking (the largest single bet in the
-- buyer-panel plan; ~32 personas across healthcare, construction, retail,
-- salons, daycare, ALF).
--
-- The data model adds a second axis to the deadlines surface: a *staff
-- member* can hold *credentials* each with their own renewal cycle. The
-- existing deadlines table stays untouched for entity-level filings; this
-- migration introduces the four staff-side tables.
--
-- Schema notes:
--   • staff_members.user_id is optional — many staff (caregivers, sub
--     contractors) will not have an OperatorOS account themselves; the
--     business owner manages them on their behalf.
--   • credential_types is cross-tenant (no business_id) so the same
--     "CPR/BLS" or "EPA 608" definition can be referenced by every business
--     that needs it. Per-business overrides land in staff_credentials.
--   • staff_credentials.expires_date is the load-bearing column for the
--     reminder cron — the existing reminders/route cron will fan out
--     per-staff-credential alongside entity deadlines.
--   • credential_renewals_log keeps an append-only audit of renewal events
--     and the reminder messages that fired.
--   • RLS is business-scoped on the three tenant-scoped tables; the cross-
--     tenant credential_types table is readable by anyone authenticated
--     (it's just a library of credential definitions), writable by admins.

create extension if not exists "pgcrypto";

-- ─── staff_members ──────────────────────────────────────────────────────

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 200),
  email text check (email is null or char_length(email) <= 320),
  role text check (role is null or char_length(role) <= 100),
  employment_type text check (
    employment_type is null
    or employment_type in ('w2', '1099', 'volunteer', 'owner', 'other')
  ),
  hire_date date,
  end_date date,
  user_id uuid references auth.users(id) on delete set null,
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_members_business_idx
  on public.staff_members (business_id)
  where end_date is null;

create index if not exists staff_members_business_all_idx
  on public.staff_members (business_id, end_date);

alter table public.staff_members enable row level security;

drop policy if exists staff_members_select on public.staff_members;
create policy staff_members_select
  on public.staff_members for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = staff_members.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists staff_members_write on public.staff_members;
create policy staff_members_write
  on public.staff_members for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = staff_members.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = staff_members.business_id
        and b.owner_id = auth.uid()
    )
  );

create or replace function public.touch_staff_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists staff_members_updated_at on public.staff_members;
create trigger staff_members_updated_at
  before update on public.staff_members
  for each row execute function public.touch_staff_members_updated_at();

-- ─── credential_types (library, cross-tenant) ────────────────────────────

create table if not exists public.credential_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 2 and 120),
  name text not null check (char_length(name) between 1 and 200),
  agency text check (agency is null or char_length(agency) <= 200),
  jurisdiction_code text,
  vertical_tag text check (
    vertical_tag is null or vertical_tag in (
      'healthcare', 'construction', 'food_service', 'personal_services',
      'retail', 'transportation', 'manufacturing', 'fitness',
      'business_services', 'other'
    )
  ),
  default_validity_days integer check (
    default_validity_days is null or default_validity_days between 1 and 36500
  ),
  description text check (description is null or char_length(description) <= 4000),
  source_url text check (source_url is null or char_length(source_url) <= 2000),
  ce_required_hours integer check (
    ce_required_hours is null or ce_required_hours between 0 and 1000
  ),
  ce_period_months integer check (
    ce_period_months is null or ce_period_months between 1 and 240
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credential_types_vertical_idx
  on public.credential_types (vertical_tag);

create index if not exists credential_types_jurisdiction_idx
  on public.credential_types (jurisdiction_code)
  where jurisdiction_code is not null;

alter table public.credential_types enable row level security;

-- Anyone authenticated can browse the library; mutation locked to admins.
drop policy if exists credential_types_read on public.credential_types;
create policy credential_types_read
  on public.credential_types for select
  to authenticated
  using (true);

drop policy if exists credential_types_admin_write on public.credential_types;
create policy credential_types_admin_write
  on public.credential_types for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create or replace function public.touch_credential_types_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists credential_types_updated_at on public.credential_types;
create trigger credential_types_updated_at
  before update on public.credential_types
  for each row execute function public.touch_credential_types_updated_at();

-- ─── staff_credentials (many-to-many w/ expiry) ──────────────────────────

create table if not exists public.staff_credentials (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references public.staff_members(id) on delete cascade,
  credential_type_id uuid not null references public.credential_types(id) on delete restrict,
  -- denormalized business_id for RLS (joins through staff_members would
  -- otherwise force every query through a check policy).
  business_id uuid not null references public.businesses(id) on delete cascade,
  identifier text check (identifier is null or char_length(identifier) <= 200),
  issued_date date,
  expires_date date,
  status text not null default 'active' check (
    status in ('active', 'expired', 'pending', 'revoked')
  ),
  document_id uuid references public.documents(id) on delete set null,
  last_verified_at timestamptz,
  last_verified_by uuid references auth.users(id) on delete set null,
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_member_id, credential_type_id)
);

create index if not exists staff_credentials_business_idx
  on public.staff_credentials (business_id);

create index if not exists staff_credentials_expiry_idx
  on public.staff_credentials (expires_date)
  where status in ('active', 'pending') and expires_date is not null;

create index if not exists staff_credentials_staff_idx
  on public.staff_credentials (staff_member_id);

alter table public.staff_credentials enable row level security;

drop policy if exists staff_credentials_select on public.staff_credentials;
create policy staff_credentials_select
  on public.staff_credentials for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = staff_credentials.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists staff_credentials_write on public.staff_credentials;
create policy staff_credentials_write
  on public.staff_credentials for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = staff_credentials.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = staff_credentials.business_id
        and b.owner_id = auth.uid()
    )
  );

create or replace function public.touch_staff_credentials_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists staff_credentials_updated_at on public.staff_credentials;
create trigger staff_credentials_updated_at
  before update on public.staff_credentials
  for each row execute function public.touch_staff_credentials_updated_at();

-- ─── credential_renewals_log (audit) ─────────────────────────────────────

create table if not exists public.credential_renewals_log (
  id uuid primary key default gen_random_uuid(),
  staff_credential_id uuid not null references public.staff_credentials(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_kind text not null check (
    event_kind in ('renewed', 'reminder_sent', 'expired_observed', 'verified', 'revoked')
  ),
  previous_expires_date date,
  new_expires_date date,
  channel text check (channel is null or channel in ('email', 'sms', 'in_app')),
  recipient text check (recipient is null or char_length(recipient) <= 320),
  notes text check (notes is null or char_length(notes) <= 4000),
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now()
);

create index if not exists credential_renewals_log_credential_idx
  on public.credential_renewals_log (staff_credential_id, recorded_at desc);

create index if not exists credential_renewals_log_business_idx
  on public.credential_renewals_log (business_id, recorded_at desc);

alter table public.credential_renewals_log enable row level security;

-- Append-only from app code (no UPDATE/DELETE policy at all → only inserts
-- via service-role client succeed). SELECT scoped to business owner.
drop policy if exists credential_renewals_log_select on public.credential_renewals_log;
create policy credential_renewals_log_select
  on public.credential_renewals_log for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = credential_renewals_log.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

-- ─── seed a starter credential library ───────────────────────────────────
-- A minimum viable library so a business can onboard staff without the
-- admin having to backfill credential definitions first. Per-vertical
-- matrices (~200 credentials) is a content-research task tracked separately.

insert into public.credential_types
  (slug, name, agency, jurisdiction_code, vertical_tag, default_validity_days, description)
values
  -- Universal / multi-vertical
  ('cpr-bls', 'CPR / BLS', 'American Heart Association', null, null, 730,
   'CPR and Basic Life Support certification. Two-year cycle.'),
  ('first-aid', 'First Aid', 'American Red Cross', null, null, 730,
   'Standard First Aid certification. Two-year cycle.'),
  ('osha-10', 'OSHA 10-hour General Industry', 'OSHA', null, 'construction', 1825,
   '10-hour OSHA outreach training. No expiry by federal rule; some states require 5-year refresh.'),
  ('osha-30', 'OSHA 30-hour General Industry', 'OSHA', null, 'construction', 1825,
   '30-hour OSHA outreach training. No expiry by federal rule; some states require 5-year refresh.'),
  ('osha-bloodborne', 'OSHA Bloodborne Pathogens', 'OSHA', null, 'healthcare', 365,
   'Annual bloodborne-pathogens training required for at-risk workers.'),
  -- Healthcare
  ('rn-license', 'Registered Nurse license', 'State board of nursing', null, 'healthcare', 730,
   'State-issued RN license. Renewal cycle varies by state (often 2 years).'),
  ('lpn-license', 'Licensed Practical Nurse license', 'State board of nursing', null, 'healthcare', 730,
   'State-issued LPN license. Renewal cycle varies by state.'),
  ('cna-cert', 'Certified Nursing Assistant', 'State health department', null, 'healthcare', 730,
   'Certified Nursing Assistant certification.'),
  ('dea-registration', 'DEA Controlled Substance registration', 'DEA', null, 'healthcare', 1095,
   'Federal DEA registration for prescribing controlled substances. Triennial.'),
  -- Food service
  ('food-handler', 'Food Handler card', 'State health department', null, 'food_service', 1095,
   'State food-handler certification. Renewal cycle varies (typically 3 years).'),
  ('food-protection-manager', 'Certified Food Protection Manager', 'ANSI-accredited', null, 'food_service', 1825,
   'ServSafe / Prometric / National Registry of Food Safety Professionals. 5-year cycle.'),
  -- Personal services
  ('cosmetology-license', 'Cosmetology license', 'State cosmetology board', null, 'personal_services', 730,
   'State-issued cosmetology license. Renewal cycle varies.'),
  ('barber-license', 'Barber license', 'State barbering board', null, 'personal_services', 730,
   'State-issued barber license.'),
  -- Construction trades
  ('epa-608', 'EPA 608 Universal', 'EPA', null, 'construction', 36500,
   'EPA Section 608 refrigerant handler certification (universal). Lifetime certification.'),
  ('nabcep-pv', 'NABCEP PV Installation Professional', 'NABCEP', null, 'construction', 1095,
   'NABCEP PV installation certification. 3-year cycle with CE.'),
  ('asbestos-worker', 'Asbestos worker O&M', 'EPA / state', null, 'construction', 365,
   'Asbestos worker operations & maintenance training. Annual refresher.'),
  -- Transportation
  ('cdl-class-a', 'CDL Class A', 'State DMV / FMCSA', null, 'transportation', 730,
   'Commercial Driver License, Class A. Renewal cycle varies by state.'),
  ('dot-medical-card', 'DOT Medical Examiner certificate', 'FMCSA', null, 'transportation', 730,
   'DOT medical card. Up to 2-year cycle; can be shorter if conditional.'),
  -- Retail / liquor
  ('tips-certification', 'TIPS alcohol service', 'TIPS', null, 'food_service', 1095,
   'Training for Intervention Procedures alcohol-server cert. 3-year cycle.'),
  ('serve-safe-alcohol', 'ServSafe Alcohol', 'NRA', null, 'food_service', 1095,
   'NRA-administered alcohol-server cert. 3-year cycle.')
on conflict (slug) do nothing;
