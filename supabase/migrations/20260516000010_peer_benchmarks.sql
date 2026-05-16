-- Workstream C · Peer Benchmark Scoring
-- See docs/roadmap/WORLD_CLASS.md §3 Workstream C.
--
-- Materialized view of cohort score distributions, partitioned by
-- (industry_slug, state). Only emits rows where cohort_size >= 10 so a
-- benchmark cannot be reverse-engineered to a single business (k-anonymity).
-- Refreshed weekly via /api/cron/refresh-benchmarks (Vercel Cron, Sunday 02:00 UTC).

CREATE MATERIALIZED VIEW IF NOT EXISTS public.industry_benchmarks AS
WITH primary_location AS (
  SELECT DISTINCT ON (business_id)
    business_id, state
  FROM public.locations
  WHERE state IS NOT NULL AND state <> ''
  ORDER BY business_id, id
),
latest_scores AS (
  SELECT DISTINCT ON (business_id)
    business_id, score, recorded_at
  FROM public.compliance_score_history
  ORDER BY business_id, recorded_at DESC
)
SELECT
  b.industry_slug,
  pl.state AS state_code,
  count(*)::int AS cohort_size,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY ls.score::numeric)::numeric(5,2) AS p25,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY ls.score::numeric)::numeric(5,2) AS median,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY ls.score::numeric)::numeric(5,2) AS p75,
  percentile_cont(0.90) WITHIN GROUP (ORDER BY ls.score::numeric)::numeric(5,2) AS p90,
  max(ls.recorded_at) AS last_captured_at
FROM public.businesses b
JOIN primary_location pl ON pl.business_id = b.id
JOIN latest_scores ls ON ls.business_id = b.id
WHERE b.industry_slug IS NOT NULL
  AND b.onboarding_complete = true
GROUP BY b.industry_slug, pl.state
HAVING count(*) >= 10;

-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY.
CREATE UNIQUE INDEX IF NOT EXISTS industry_benchmarks_pk
  ON public.industry_benchmarks (industry_slug, state_code);

-- Public read for authenticated users — only aggregates above k-anonymity
-- threshold; no PII, no business identifiers.
GRANT SELECT ON public.industry_benchmarks TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_industry_benchmarks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.industry_benchmarks;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_industry_benchmarks() FROM public;
GRANT EXECUTE ON FUNCTION public.refresh_industry_benchmarks() TO service_role;
