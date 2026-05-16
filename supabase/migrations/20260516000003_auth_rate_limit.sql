-- PR1 foundation: durable rate limiting for the auth surface.
--
-- Generic keyed throttle, callable from any server route. Mirrors the
-- atomic check-and-increment pattern from ai_rate_limits but takes a
-- text key (e.g. "auth:signin:<ip>:<email>") so callers can scope as
-- they like. Service-role only — the auth pages call this through
-- the admin client to avoid RLS round-trips.

create table if not exists public.auth_rate_limits (
  key text primary key,
  attempts int not null default 1,
  window_start timestamptz not null default now()
);

alter table public.auth_rate_limits enable row level security;

-- No end-user access; service role only.
revoke all on table public.auth_rate_limits from public, anon, authenticated;

create or replace function public.try_consume_auth_rate_limit(
  p_key text,
  p_max_attempts int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz := now() - (p_window_seconds || ' seconds')::interval;
  v_rows int;
begin
  -- Try atomic increment within window, below limit.
  update public.auth_rate_limits
     set attempts = attempts + 1
   where key = p_key
     and window_start >= v_window_start
     and attempts < p_max_attempts;

  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    return true;
  end if;

  -- No row updated: either no row, expired window, or at-limit row.
  -- Try to (re)create a fresh window. The WHERE guards against
  -- resetting a row that's still within its current window and at
  -- the limit — in that case nothing updates and we return false.
  insert into public.auth_rate_limits (key, attempts, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set attempts = 1,
        window_start = now()
    where public.auth_rate_limits.window_start < v_window_start;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.try_consume_auth_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.try_consume_auth_rate_limit(text, int, int) to service_role;

-- Best-effort cleanup of stale rows. The window_start column is the natural
-- TTL, so anything older than a day is safe to evict. Run from the cron
-- alongside reminders in PR6; for now the table just grows slowly and the
-- atomic check still works.
create index if not exists auth_rate_limits_window_idx
  on public.auth_rate_limits (window_start);
