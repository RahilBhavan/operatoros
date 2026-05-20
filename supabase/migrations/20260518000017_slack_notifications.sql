-- WS-G.Slack — Slack reminder channel via incoming-webhook URL.
--
-- v1 ships a webhook-URL flow: the user creates an "Incoming Webhook" in
-- their own Slack workspace (https://api.slack.com/messaging/webhooks),
-- copies the resulting https://hooks.slack.com/services/... URL, and pastes
-- it into /settings/notifications. The cron path then POSTs reminder
-- payloads to that URL.
--
-- An OAuth upgrade (with a registered Slack app, channel picker, and
-- pgsodium-encrypted bot token) is a future workstream. The columns
-- slack_team_id / slack_team_name / slack_channel_name are reserved now so
-- the upgrade is additive — webhook-URL rows simply leave them null.

alter table public.notification_preferences
  add column if not exists slack_enabled boolean not null default false,
  add column if not exists slack_webhook_url text check (
    slack_webhook_url is null
    or slack_webhook_url ~ '^https://hooks\.slack\.com/services/[A-Za-z0-9/]+$'
  ),
  add column if not exists slack_severity_threshold text not null default 'high' check (
    slack_severity_threshold in ('critical', 'high', 'medium', 'low', 'info')
  ),
  add column if not exists slack_team_id text,
  add column if not exists slack_team_name text,
  add column if not exists slack_channel_name text,
  add column if not exists slack_connected_at timestamptz;

create index if not exists notification_preferences_slack_idx
  on public.notification_preferences (user_id)
  where slack_enabled = true and slack_webhook_url is not null;

-- ─── slack_log ──────────────────────────────────────────────────────────
-- Append-only delivery audit. The webhook URL itself is sensitive (anyone
-- holding it can post to the channel), so we store sha256(url) not the URL.

create table if not exists public.slack_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  webhook_url_hash text not null check (char_length(webhook_url_hash) = 64),
  body text not null check (char_length(body) between 1 and 4000),
  kind text not null check (kind in ('reminder', 'system')),
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'failed')
  ),
  http_status integer check (http_status is null or (http_status between 100 and 599)),
  error_code text,
  sent_at timestamptz not null default now()
);

create index if not exists slack_log_business_idx on public.slack_log(business_id, sent_at desc);
create index if not exists slack_log_user_idx on public.slack_log(user_id, sent_at desc);

alter table public.slack_log enable row level security;

-- Owners read their own log; service_role writes.
drop policy if exists slack_log_owner_read on public.slack_log;
create policy slack_log_owner_read
  on public.slack_log for select
  to authenticated
  using (
    user_id = auth.uid()
    or business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );

drop policy if exists slack_log_service_insert on public.slack_log;
create policy slack_log_service_insert
  on public.slack_log for insert
  to service_role
  with check (true);

-- Extend reminder_log.reminder_type CHECK so the cron fan-out can write
-- slack-* variants. The unique (deadline_id, reminder_type) constraint
-- already covers idempotency across email/SMS/Slack for the same window.

alter table public.reminder_log
  drop constraint if exists reminder_log_reminder_type_check;

alter table public.reminder_log
  add constraint reminder_log_reminder_type_check
  check (
    reminder_type in (
      '90_day', '60_day', '30_day', '7_day', '1_day',
      'sms-90_day', 'sms-60_day', 'sms-30_day', 'sms-7_day', 'sms-1_day',
      'slack-7_day', 'slack-1_day'
    )
  );
