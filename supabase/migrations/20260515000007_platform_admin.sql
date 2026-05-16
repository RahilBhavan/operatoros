-- Platform admin (CEOs / staff) — distinct from per-business memberships.
-- A platform admin can see every business and every user. The membership
-- table only governs intra-tenant access; this table governs cross-tenant.

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_active
  ON public.platform_admins (user_id) WHERE revoked_at IS NULL;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read the table. Service role bypasses RLS.
CREATE POLICY "Platform admins read themselves and peers"
  ON public.platform_admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = (SELECT auth.uid()) AND pa.revoked_at IS NULL
    )
  );

-- SECURITY DEFINER helper so RLS policies on other tables can call it without
-- having to repeat the JOIN. Returns true if the calling user is an active
-- platform admin. Idempotent and safe to call from anywhere.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid() AND revoked_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;

-- One-time invite tokens for new platform admins. Created by an existing
-- admin, claimed by the recipient via /admin/accept/[token].
CREATE TABLE IF NOT EXISTS public.platform_admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_email text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_platform_admin_invites_token
  ON public.platform_admin_invites (token) WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_platform_admin_invites_created_by
  ON public.platform_admin_invites (created_by);

ALTER TABLE public.platform_admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage invites"
  ON public.platform_admin_invites
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Accept-invite RPC: claims a token in one atomic step.
CREATE OR REPLACE FUNCTION public.claim_platform_admin_invite(p_token text, p_display_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_invite_id uuid;
  v_email text;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  -- Lock the invite row to prevent double-claim races.
  SELECT id, invited_email INTO v_invite_id, v_email
    FROM public.platform_admin_invites
   WHERE token = p_token
     AND used_at IS NULL
     AND revoked_at IS NULL
     AND expires_at > now()
   FOR UPDATE;

  IF v_invite_id IS NULL THEN
    RETURN false;
  END IF;

  -- Mark invite used and add the user to platform_admins.
  UPDATE public.platform_admin_invites
     SET used_at = now(), used_by = uid
   WHERE id = v_invite_id;

  INSERT INTO public.platform_admins (user_id, display_name, created_by)
  VALUES (uid, COALESCE(p_display_name, v_email), (
    SELECT created_by FROM public.platform_admin_invites WHERE id = v_invite_id
  ))
  ON CONFLICT (user_id) DO UPDATE
    SET revoked_at = NULL, display_name = COALESCE(public.platform_admins.display_name, EXCLUDED.display_name);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_platform_admin_invite(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_platform_admin_invite(text, text) TO authenticated;
