-- Admin dashboard helpers: track when a waitlist row was promoted to invited
-- so the admin can see queue progression without a separate events table.
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS invited_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_waitlist_invited_at
  ON public.waitlist_signups (invited_at) WHERE invited_at IS NULL;
