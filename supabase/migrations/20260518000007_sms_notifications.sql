-- WS-1.1 — SMS reminders. ~22 personas in the panel (owner-operators, food
-- trucks, contractors, salons, farmers) said email is missed; SMS is
-- non-negotiable for field workers.
--
-- This migration adds two tables:
--   • notification_preferences — per-user channel + severity threshold +
--     quiet hours. TCPA opt-in timestamp + IP recorded for compliance.
--   • sms_log — append-only audit of every SMS that fired (provider
--     message_id, recipient, cost cents, status), for delivery debugging
--     and cost-cap enforcement.
--
-- The Twilio wrapper itself is env-gated on TWILIO_ACCOUNT_SID +
-- TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER. Without those, the cron path
-- falls through (no exception); SMS simply doesn't fire.

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  phone_number text check (
    phone_number is null
    or phone_number ~ '^\+[1-9][0-9]{6,14}$'
  ),
  phone_verified_at timestamptz,
  sms_severity_threshold text not null default 'high' check (
    sms_severity_threshold in ('critical', 'high', 'medium', 'low', 'info')
  ),
  quiet_hours_start time,
  quiet_hours_end time,
  tcpa_opted_in_at timestamptz,
  tcpa_opt_in_ip text check (tcpa_opt_in_ip is null or char_length(tcpa_opt_in_ip) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_preferences_sms_idx
  on public.notification_preferences (user_id)
  where sms_enabled = true and phone_verified_at is not null;

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_self on public.notification_preferences;
create policy notification_preferences_self
  on public.notification_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.touch_notification_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists notification_preferences_updated_at
  on public.notification_preferences;
create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.touch_notification_preferences_updated_at();

-- ─── sms_log ─────────────────────────────────────────────────────────────

create table if not exists public.sms_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  to_phone text not null check (to_phone ~ '^\+[1-9][0-9]{6,14}$'),
  body text not null check (char_length(body) between 1 and 1600),
  kind text not null check (kind in ('reminder', 'verification', 'system')),
  provider text not null default 'twilio' check (provider in ('twilio')),
  provider_message_id text,
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'delivered', 'failed', 'undelivered')
  ),
  cost_cents integer check (cost_cents is null or cost_cents >= 0),
  error_code text,
  sent_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists sms_log_user_idx
  on public.sms_log (user_id, sent_at desc)
  where user_id is not null;

create index if not exists sms_log_business_idx
  on public.sms_log (business_id, sent_at desc)
  where business_id is not null;

create index if not exists sms_log_unsent_idx
  on public.sms_log (sent_at)
  where status = 'queued';

alter table public.sms_log enable row level security;

-- Admin-only reads (delivery debugging + cost monitoring). Inserts via
-- service-role client only.
drop policy if exists sms_log_admin_read on public.sms_log;
create policy sms_log_admin_read
  on public.sms_log for select
  to authenticated
  using (public.is_platform_admin());
