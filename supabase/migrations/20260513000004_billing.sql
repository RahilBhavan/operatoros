-- Add billing fields to businesses
alter table businesses
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists plan_tier text not null default 'free'
    check (plan_tier in ('free', 'starter', 'growth', 'scale')),
  add column if not exists billing_status text not null default 'inactive'
    check (billing_status in ('trialing', 'active', 'past_due', 'canceled', 'inactive')),
  add column if not exists trial_ends_at timestamptz;

-- Reminder log to track which reminders have been sent
create table if not exists reminder_log (
  id uuid primary key default gen_random_uuid(),
  deadline_id uuid not null references deadlines(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('90_day', '60_day', '30_day', '7_day', '1_day')),
  sent_at timestamptz not null default now(),
  recipient_email text not null,
  unique (deadline_id, reminder_type)
);

create index if not exists reminder_log_deadline_id_idx on reminder_log(deadline_id);
create index if not exists reminder_log_business_id_idx on reminder_log(business_id);

-- Share tokens for compliance links
create table if not exists share_tokens (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index if not exists share_tokens_token_idx on share_tokens(token);
create index if not exists share_tokens_business_id_idx on share_tokens(business_id);

-- RLS for reminder_log (service role only — no direct client access)
alter table reminder_log enable row level security;
alter table share_tokens enable row level security;

-- Owners can create/read/delete their own share tokens
create policy "Owners manage their share tokens"
  on share_tokens for all
  to authenticated
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Share tokens readable by anyone with the token (enforced at API layer)
create policy "Anyone can read share tokens"
  on share_tokens for select
  to anon
  using (true);
