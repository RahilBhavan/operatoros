-- Feature moat upgrade: severity-weighted deadlines, share governance,
-- accountant access logging, reminder preferences, membership invites.

-- ── 1. Deadlines: severity + sourcing metadata ─────────────────────────────
-- Powers risk-weighted compliance score and citable evidence per deadline.
ALTER TABLE public.deadlines
  ADD COLUMN IF NOT EXISTS severity_tier text NOT NULL DEFAULT 'medium'
    CHECK (severity_tier IN ('critical', 'high', 'medium', 'low', 'info')),
  ADD COLUMN IF NOT EXISTS penalty_estimate_cents bigint,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS statute_citation text;

CREATE INDEX IF NOT EXISTS idx_deadlines_business_severity
  ON public.deadlines (business_id, severity_tier);

-- ── 2. Share tokens: governance — labels, views, revocation, configurable expiry ──
ALTER TABLE public.share_tokens
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

-- Per-view audit log so owners can answer "who looked at this and when".
CREATE TABLE IF NOT EXISTS public.share_link_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token_id uuid NOT NULL REFERENCES public.share_tokens(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent_fragment text
);

CREATE INDEX IF NOT EXISTS idx_share_link_views_token_time
  ON public.share_link_views (share_token_id, viewed_at DESC);

ALTER TABLE public.share_link_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads share views via business"
  ON public.share_link_views
  FOR SELECT
  USING (
    share_token_id IN (
      SELECT st.id FROM public.share_tokens st
      JOIN public.businesses b ON b.id = st.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Atomic record-view RPC. Called from the server-rendered share page with the
-- service-role client; bumps counters + appends a log row in one statement set.
CREATE OR REPLACE FUNCTION public.record_share_view(
  p_token text,
  p_ip_hash text,
  p_user_agent text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_id uuid;
BEGIN
  SELECT id INTO v_token_id
    FROM public.share_tokens
   WHERE token = p_token
     AND revoked_at IS NULL
     AND expires_at > now()
  LIMIT 1;

  IF v_token_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.share_tokens
     SET view_count = view_count + 1,
         last_viewed_at = now()
   WHERE id = v_token_id;

  INSERT INTO public.share_link_views (share_token_id, ip_hash, user_agent_fragment)
  VALUES (v_token_id, p_ip_hash, p_user_agent);
END;
$$;

REVOKE ALL ON FUNCTION public.record_share_view(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_share_view(text, text, text) TO service_role;

-- ── 3. Accountant connections: expiry + revocation + access log ────────────
ALTER TABLE public.accountant_connections
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

-- Backfill expires_at for any pre-existing rows so the NOT NULL holds.
UPDATE public.accountant_connections
   SET expires_at = created_at + interval '90 days'
 WHERE expires_at IS NULL;

CREATE TABLE IF NOT EXISTS public.accountant_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.accountant_connections(id) ON DELETE CASCADE,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent_fragment text,
  action text NOT NULL DEFAULT 'view'
    CHECK (action IN ('view', 'note_added', 'note_edited', 'export'))
);

CREATE INDEX IF NOT EXISTS idx_accountant_access_log_conn_time
  ON public.accountant_access_log (connection_id, accessed_at DESC);

ALTER TABLE public.accountant_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads accountant access log via business"
  ON public.accountant_access_log
  FOR SELECT
  USING (
    connection_id IN (
      SELECT ac.id FROM public.accountant_connections ac
      JOIN public.businesses b ON b.id = ac.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

-- ── 4. Reminder preferences (per business, with unsubscribe token) ─────────
CREATE TABLE IF NOT EXISTS public.reminder_preferences (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  unsubscribe_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  email_enabled boolean NOT NULL DEFAULT true,
  digest_only boolean NOT NULL DEFAULT false,
  muted_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages reminder preferences"
  ON public.reminder_preferences
  FOR ALL
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE TRIGGER reminder_preferences_updated_at
  BEFORE UPDATE ON public.reminder_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Token-gated unsubscribe RPC: flips email_enabled to false. No auth required;
-- the unsubscribe link in emails carries the token.
CREATE OR REPLACE FUNCTION public.unsubscribe_reminders(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int;
BEGIN
  UPDATE public.reminder_preferences
     SET email_enabled = false, updated_at = now()
   WHERE unsubscribe_token = p_token;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_reminders(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_reminders(text) TO anon, authenticated, service_role;

-- ── 5. Memberships: real invite lifecycle ──────────────────────────────────
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS invite_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'revoked'));

UPDATE public.memberships SET status = 'active', accepted_at = created_at
 WHERE user_id IS NOT NULL AND status = 'active' AND accepted_at IS NULL;

-- ── 6. Audit events: typed, queryable activity stream (separate from audit_log) ──
-- audit_log records before/after JSON for entity mutations; audit_events is a
-- lightweight stream for UI surfaces (security center, "recent activity").
CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_business_time
  ON public.audit_events (business_id, occurred_at DESC);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads their audit events"
  ON public.audit_events
  FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role writes audit events"
  ON public.audit_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ── 7. AI insight cache (skip Anthropic call on identical context) ─────────
CREATE TABLE IF NOT EXISTS public.ai_insight_cache (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  context_hash text NOT NULL,
  insights jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insight_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own AI cache"
  ON public.ai_insight_cache
  FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role manages AI cache"
  ON public.ai_insight_cache
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ── 7b. Waitlist: jurisdiction signal + referral primitive ────────────────
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS industry_slug text,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE
    DEFAULT encode(gen_random_bytes(8), 'hex'),
  ADD COLUMN IF NOT EXISTS referred_by_code text,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code
  ON public.waitlist_signups (referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_state
  ON public.waitlist_signups (state);

-- ── 8. Document versions: keep history when a doc is replaced ──────────────
CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL,
  superseded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_document_versions_doc
  ON public.document_versions (document_id, superseded_at DESC);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads document versions"
  ON public.document_versions
  FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role manages document versions"
  ON public.document_versions
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
