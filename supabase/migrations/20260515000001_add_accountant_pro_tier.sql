-- Add accountant_pro to the plan_tier check constraint
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_tier_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_plan_tier_check
  CHECK (plan_tier IN ('free', 'starter', 'growth', 'scale', 'accountant_pro'));
