-- Supabase grants EXECUTE on public-schema functions to anon/authenticated separately,
-- so the REVOKE ... FROM PUBLIC in the prior migration did not strip the explicit anon grant.
-- This makes the revoke explicit and clears the advisor warning.
REVOKE EXECUTE ON FUNCTION public.try_consume_ai_rate_limit(integer, interval) FROM anon, public;
