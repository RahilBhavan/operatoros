-- WS-3.2 — Per-jobsite / per-project compliance tracking. ~9 construction
-- personas in the panel (GC, electrician, plumber, HVAC, solar, demo, etc.)
-- said their compliance is "per-job, not per-quarter."
--
-- Schema notes:
--   • projects.jurisdiction_code overrides business HQ for projects in a
--     different state — common for GCs working across borders.
--   • project_deadlines mirrors the per-business deadlines shape but
--     scoped to a project. Reminder cron will fan out alongside entity
--     deadlines.
--   • project_documents joins documents to projects (a document can be
--     attached to a deadline AND a project — both join tables coexist).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  address text check (address is null or char_length(address) <= 1000),
  jurisdiction_code text,
  customer_name text check (customer_name is null or char_length(customer_name) <= 200),
  gc_business_name text check (gc_business_name is null or char_length(gc_business_name) <= 200),
  start_date date,
  end_date date,
  status text not null default 'active' check (
    status in ('planned', 'active', 'on_hold', 'completed', 'cancelled')
  ),
  value_cents bigint check (value_cents is null or value_cents >= 0),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_business_idx
  on public.projects (business_id, status);

create index if not exists projects_business_active_idx
  on public.projects (business_id, start_date desc)
  where status in ('planned', 'active');

alter table public.projects enable row level security;

drop policy if exists projects_select on public.projects;
create policy projects_select
  on public.projects for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = projects.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists projects_write on public.projects;
create policy projects_write
  on public.projects for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = projects.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = projects.business_id
        and b.owner_id = auth.uid()
    )
  );

create or replace function public.touch_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.touch_projects_updated_at();

-- ─── project_deadlines ───────────────────────────────────────────────────

create table if not exists public.project_deadlines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text check (description is null or char_length(description) <= 4000),
  governing_agency text check (governing_agency is null or char_length(governing_agency) <= 200),
  due_date date not null,
  status text not null default 'upcoming' check (
    status in ('upcoming', 'in_progress', 'compliant', 'overdue')
  ),
  severity_tier text not null default 'medium' check (
    severity_tier in ('critical', 'high', 'medium', 'low', 'info')
  ),
  document_id uuid references public.documents(id) on delete set null,
  source_url text check (source_url is null or char_length(source_url) <= 2000),
  statute_citation text check (statute_citation is null or char_length(statute_citation) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_deadlines_project_idx
  on public.project_deadlines (project_id, due_date);

create index if not exists project_deadlines_business_idx
  on public.project_deadlines (business_id, due_date);

alter table public.project_deadlines enable row level security;

drop policy if exists project_deadlines_select on public.project_deadlines;
create policy project_deadlines_select
  on public.project_deadlines for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = project_deadlines.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists project_deadlines_write on public.project_deadlines;
create policy project_deadlines_write
  on public.project_deadlines for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = project_deadlines.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = project_deadlines.business_id
        and b.owner_id = auth.uid()
    )
  );

-- ─── project_documents (join) ────────────────────────────────────────────

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, document_id)
);

create index if not exists project_documents_project_idx
  on public.project_documents (project_id);

alter table public.project_documents enable row level security;

drop policy if exists project_documents_select on public.project_documents;
create policy project_documents_select
  on public.project_documents for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = project_documents.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

drop policy if exists project_documents_write on public.project_documents;
create policy project_documents_write
  on public.project_documents for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = project_documents.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = project_documents.business_id
        and b.owner_id = auth.uid()
    )
  );
