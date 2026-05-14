-- Accountant notes on individual deadlines.
-- Allows accountants to annotate client deadlines through their portal.
create table if not exists accountant_deadline_notes (
  id uuid primary key default gen_random_uuid(),
  deadline_id uuid not null references deadlines(id) on delete cascade,
  accountant_token text not null,
  note text not null check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One note per accountant per deadline (upsert pattern)
create unique index if not exists accountant_deadline_notes_unique
  on accountant_deadline_notes (deadline_id, accountant_token);

-- No RLS needed — access is via service role using a valid token lookup
-- (token → connection → business_id → deadline_id chain enforced in API)
