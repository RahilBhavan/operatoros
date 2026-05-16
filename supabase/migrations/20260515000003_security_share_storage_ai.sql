-- Hardening: remove anon share surface, scope storage to owned businesses, atomic AI rate limit RPC.

-- Share: remove policies that allowed anon enumeration or cross-token reads.
DROP POLICY IF EXISTS "Anyone can read share tokens" ON public.share_tokens;
DROP POLICY IF EXISTS "Anon can read shared business info" ON public.businesses;
DROP POLICY IF EXISTS "Anon can read shared deadlines" ON public.deadlines;

-- Storage: require object key prefix {business_id}/... where business is owned by caller.
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read their documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND split_part(name, '/', 1)::uuid IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can read their documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND split_part(name, '/', 1)::uuid IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can delete their documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND split_part(name, '/', 1)::uuid IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- Atomic, race-safe AI rate limiting (called with user JWT; locks per user for the transaction).
CREATE OR REPLACE FUNCTION public.try_consume_ai_rate_limit(p_max integer, p_window interval)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_count int;
  v_start timestamptz;
  threshold timestamptz := clock_timestamp() - p_window;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(uid::text));

  SELECT request_count, window_start INTO v_count, v_start
  FROM public.ai_rate_limits
  WHERE user_id = uid
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.ai_rate_limits (user_id, request_count, window_start)
    VALUES (uid, 1, clock_timestamp());
    RETURN true;
  END IF;

  IF v_start < threshold THEN
    UPDATE public.ai_rate_limits
    SET request_count = 1, window_start = clock_timestamp()
    WHERE user_id = uid;
    RETURN true;
  END IF;

  IF v_count >= p_max THEN
    RETURN false;
  END IF;

  UPDATE public.ai_rate_limits
  SET request_count = v_count + 1
  WHERE user_id = uid;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.try_consume_ai_rate_limit(integer, interval) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_consume_ai_rate_limit(integer, interval) TO authenticated;
