-- Phase 0: Waitlist signups table
create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  signed_up_at timestamptz not null default now(),
  source text default 'landing_page',
  notes text
);

-- RLS: only service role can read/write (public insert via API route with service key)
alter table waitlist_signups enable row level security;

-- No public read access
create policy "No public read"
  on waitlist_signups for select
  using (false);

-- No direct public insert (inserts go through the API route using service role key)
create policy "No public insert"
  on waitlist_signups for insert
  with check (false);
