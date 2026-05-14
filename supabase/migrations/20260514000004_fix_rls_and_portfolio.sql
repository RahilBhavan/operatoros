-- Fix: remove overly permissive anon read policy on accountant_connections
-- The accountant portal uses the service role (admin client) which bypasses RLS entirely.
-- The USING(true) policy allowed any anon/authenticated user to SELECT all rows,
-- exposing tokens, emails, and business_ids without a token.
DROP POLICY IF EXISTS "Accountants can read via token" ON accountant_connections;

-- Add business_id index on accountant_connections for portfolio queries (look up by email)
CREATE INDEX IF NOT EXISTS idx_accountant_connections_business
  ON accountant_connections (business_id);
