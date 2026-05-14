-- Compliance score history for trend tracking
CREATE TABLE IF NOT EXISTS compliance_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  recorded_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_score_history_business_time
  ON compliance_score_history (business_id, recorded_at DESC);

-- Accountant portal connections
CREATE TABLE IF NOT EXISTS accountant_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  accountant_email text NOT NULL,
  accountant_name text,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamp with time zone DEFAULT now(),
  last_accessed_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_accountant_connections_token
  ON accountant_connections (token);

CREATE INDEX IF NOT EXISTS idx_accountant_connections_email
  ON accountant_connections (accountant_email);

-- Allow anonymous reads on share tokens (accountant view uses service role; this is for the public portal)
ALTER TABLE accountant_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owner manages their accountant connections"
  ON accountant_connections
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Anonymous access for accountant viewing (token-gated)
CREATE POLICY "Accountants can read via token"
  ON accountant_connections
  FOR SELECT
  USING (true);

-- Add status column to reminder_log for retry capability
ALTER TABLE reminder_log ADD COLUMN IF NOT EXISTS
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'));

-- Reminder click/open tracking
ALTER TABLE reminder_log ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone;
ALTER TABLE reminder_log ADD COLUMN IF NOT EXISTS clicked_at timestamp with time zone;

-- Allow anonymous score history reads for accountant portal
ALTER TABLE compliance_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owner reads their own score history"
  ON compliance_score_history
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role inserts score history"
  ON compliance_score_history
  FOR INSERT
  WITH CHECK (true);
