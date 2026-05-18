-- WS-3.4 — Multi-location / multi-entity. The `locations` table already
-- exists (deadlines.location_id references it for state scoping); this
-- migration adds human-friendly metadata so a chain operator (laundromat,
-- coffee, barbershop, brewery+taproom) can see one row per location.

alter table public.locations
  add column if not exists name text;

alter table public.locations
  add column if not exists open_date date;

alter table public.locations
  add column if not exists close_date date;

alter table public.locations
  add column if not exists created_at timestamptz not null default now();

alter table public.locations
  add column if not exists updated_at timestamptz not null default now();

-- A NOT NULL on name would break existing rows; keep it nullable and let the
-- UI default to "Primary location" when empty.

create index if not exists locations_business_active_idx
  on public.locations (business_id, open_date)
  where close_date is null;

-- ─── location_deadlines (join, optional location-scope on existing deadlines) ───

-- The existing deadlines table already has location_id (nullable). We're
-- not adding a join table — instead, the dashboard rollup queries deadlines
-- grouped by location_id. Keep the schema flat.

-- Trigger keeps updated_at honest.
create or replace function public.touch_locations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists locations_updated_at on public.locations;
create trigger locations_updated_at
  before update on public.locations
  for each row execute function public.touch_locations_updated_at();
