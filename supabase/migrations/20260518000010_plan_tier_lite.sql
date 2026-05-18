-- WS-0.3 follow-through — widen plan_tier CHECK to include 'lite'.
-- The Lite SKU is surfaced on the marketing site + a suggestion banner in
-- billing today; this migration unblocks actual checkout once the Stripe
-- lite_monthly price ID lands in env.
--
-- The previous tier-pricing migration (20260515000004) reset the constraint
-- to ('free', 'business', 'accountant'). This one drops + re-adds with 'lite'.

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_tier_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_plan_tier_check
  CHECK (plan_tier IN ('free', 'lite', 'business', 'accountant'));

-- Index existing for the dashboards used by admin reporting.
create index if not exists businesses_plan_tier_idx
  on public.businesses (plan_tier)
  where billing_status in ('active', 'trialing');
