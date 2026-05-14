-- Durable per-user rate limiting for AI insight requests.
-- Replaces in-memory Map that resets on every serverless cold start.
create table if not exists ai_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  request_count int not null default 1,
  window_start timestamptz not null default now()
);

alter table ai_rate_limits enable row level security;

-- Users can only read/write their own rate limit row
create policy "Users manage own rate limit"
  on ai_rate_limits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
