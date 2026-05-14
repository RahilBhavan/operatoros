-- Phase 1: Core application tables

-- Businesses
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry_sic_code text,
  entity_type text,
  employee_count int,
  hires_contractors boolean not null default false,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

alter table businesses enable row level security;

create policy "Owner can manage their business"
  on businesses for all
  using (auth.uid() = owner_id);

-- Locations (a business can have multiple)
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  address text,
  city text,
  state text not null,
  county text,
  zip text
);

alter table locations enable row level security;

create policy "Owner can manage locations"
  on locations for all
  using (
    exists (
      select 1 from businesses
      where businesses.id = locations.business_id
        and businesses.owner_id = auth.uid()
    )
  );

-- Deadlines
create table if not exists deadlines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  name text not null,
  description text,
  deadline_type text not null default 'other',
  governing_agency text,
  frequency text not null default 'annual',
  due_date date not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'compliant', 'overdue', 'in_progress')),
  assigned_to uuid references auth.users(id),
  source text not null default 'user_manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table deadlines enable row level security;

create policy "Owner can manage deadlines"
  on deadlines for all
  using (
    exists (
      select 1 from businesses
      where businesses.id = deadlines.business_id
        and businesses.owner_id = auth.uid()
    )
  );

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deadlines_updated_at
  before update on deadlines
  for each row execute function update_updated_at();

-- Documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  deadline_id uuid not null references deadlines(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now(),
  expiry_date date
);

alter table documents enable row level security;

create policy "Owner can manage documents"
  on documents for all
  using (
    exists (
      select 1 from businesses
      where businesses.id = documents.business_id
        and businesses.owner_id = auth.uid()
    )
  );

-- Audit log (immutable)
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "Owner can read their audit log"
  on audit_log for select
  using (
    exists (
      select 1 from businesses
      where businesses.id = audit_log.business_id
        and businesses.owner_id = auth.uid()
    )
  );
