-- Collapse 4 pricing tiers (starter/growth/scale/accountant_pro) → 2 (business/accountant)
-- Also adds account-level role enum for customer/admin role-tier separation.

-- 1. Drop the old check constraint
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_tier_check;

-- 2. Remap existing values (idempotent)
UPDATE businesses SET plan_tier = 'business'
  WHERE plan_tier IN ('starter', 'growth', 'scale');
UPDATE businesses SET plan_tier = 'accountant'
  WHERE plan_tier = 'accountant_pro';

-- 3. Re-add constraint with the new tier set
ALTER TABLE businesses ADD CONSTRAINT businesses_plan_tier_check
  CHECK (plan_tier IN ('free', 'business', 'accountant'));

-- 4. Account-level role: owner manages billing/team, member uses the app.
-- Stored on businesses for the primary owner; the memberships table below
-- handles invited users.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'customer'
    CHECK (account_type IN ('customer', 'accountant'));

-- 5. Memberships: a user can belong to a business with a role.
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'member')),
  invited_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id);
CREATE INDEX IF NOT EXISTS memberships_business_idx ON memberships(business_id);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- A user can read their own memberships
DROP POLICY IF EXISTS memberships_select_own ON memberships;
CREATE POLICY memberships_select_own ON memberships
  FOR SELECT USING (user_id = auth.uid());

-- A business owner (admin) can read/manage memberships for their business
DROP POLICY IF EXISTS memberships_admin_all ON memberships;
CREATE POLICY memberships_admin_all ON memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.business_id = memberships.business_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.business_id = memberships.business_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
  );

-- 6. Backfill: every existing owner_id becomes an admin membership for their business
INSERT INTO memberships (business_id, user_id, role)
SELECT id, owner_id, 'admin'
FROM businesses
ON CONFLICT (business_id, user_id) DO NOTHING;

-- 7. Waitlist UTM capture for analytics discipline (Meeker fix)
ALTER TABLE waitlist_signups
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS landing_path text;
