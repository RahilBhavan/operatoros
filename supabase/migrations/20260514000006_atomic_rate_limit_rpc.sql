-- Atomic rate-limit check-and-increment to prevent race conditions.
-- Returns true if request is allowed, false if limit is exceeded.
create or replace function check_and_increment_rate_limit(
  p_user_id uuid,
  p_rate_limit int,
  p_window_ms bigint
) returns boolean
language plpgsql
security definer
as $$
declare
  v_window_start timestamptz;
  v_rows_updated int;
begin
  v_window_start := now() - (p_window_ms || ' milliseconds')::interval;

  -- Attempt atomic increment within window, under limit
  update ai_rate_limits
  set request_count = request_count + 1
  where user_id = p_user_id
    and window_start >= v_window_start
    and request_count < p_rate_limit;

  get diagnostics v_rows_updated = row_count;

  if v_rows_updated > 0 then
    return true;
  end if;

  -- No row updated: either window expired, over limit, or no row yet
  -- Try to upsert a fresh window row (resets if window expired)
  insert into ai_rate_limits (user_id, request_count, window_start)
  values (p_user_id, 1, now())
  on conflict (user_id) do update
    set request_count = 1,
        window_start = now()
  where ai_rate_limits.window_start < v_window_start;

  get diagnostics v_rows_updated = row_count;

  -- If upsert did nothing, existing row is in-window and at/over limit
  return v_rows_updated > 0;
end;
$$;

-- Only the service role can call this function (bypasses RLS)
revoke all on function check_and_increment_rate_limit from public, anon, authenticated;
grant execute on function check_and_increment_rate_limit to service_role;
