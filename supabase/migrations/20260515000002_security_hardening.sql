-- 1. Enable RLS on accountant_deadline_notes (access is service-role only, so no policies needed)
ALTER TABLE public.accountant_deadline_notes ENABLE ROW LEVEL SECURITY;

-- 2. Fix compliance_score_history INSERT policy — restrict to service_role only
DROP POLICY IF EXISTS "Service role inserts score history" ON public.compliance_score_history;
CREATE POLICY "Service role inserts score history"
  ON public.compliance_score_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. Fix mutable search_path on update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. Fix mutable search_path on check_and_increment_rate_limit
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id uuid,
  p_rate_limit int,
  p_window_ms bigint
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_window_start timestamptz;
  v_rows_updated int;
BEGIN
  v_window_start := now() - (p_window_ms || ' milliseconds')::interval;

  UPDATE public.ai_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = p_user_id
    AND window_start >= v_window_start
    AND request_count < p_rate_limit;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated > 0 THEN
    RETURN true;
  END IF;

  INSERT INTO public.ai_rate_limits (user_id, request_count, window_start)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE
    SET request_count = 1,
        window_start = now()
  WHERE public.ai_rate_limits.window_start < v_window_start;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  RETURN v_rows_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit TO service_role;
