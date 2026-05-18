import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PROVIDERS,
  isProviderConfigured,
  type ProviderId,
} from "@/lib/integrations/providers";
import { entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";

const MAX_OAUTH_TOKEN_CHARS = 8192;

/**
 * Handles the OAuth redirect-back. Exchanges code for tokens, writes a
 * connection row. Token columns are written ciphered-as-text — when
 * pgcrypto column-level encryption is enabled per the migration notes,
 * the schema absorbs ciphertext transparently.
 *
 * Provider-specific quirks (Intuit's per-realm token, SimplePractice's
 * per-tenant API base) are handled by per-provider hooks in this same
 * route once those provider partnerships land.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider } = await ctx.params;
  if (!(provider in PROVIDERS)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }
  const def = PROVIDERS[provider as ProviderId];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get(`oauth_state_${provider}`)?.value;
  if (!code || !state || state !== cookieState) {
    return NextResponse.json({ error: "Bad state" }, { status: 400 });
  }
  if (!isProviderConfigured(def) || !def.tokenUrl) {
    return NextResponse.json(
      { error: "Provider not configured" },
      { status: 503 }
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan_tier")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Refuse the OAuth handshake if the tenant isn't on a paid plan — a free
  // tenant should never have reached the start route either, but guard.
  const ents = entitlementsFor(business.plan_tier);
  if (!ents.ai) {
    return NextResponse.json(
      { error: "Integrations require a paid plan." },
      { status: 403 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? url.origin;
  const redirectUri = `${appUrl}/api/integrations/${provider}/callback`;

  const form = new URLSearchParams();
  form.set("grant_type", "authorization_code");
  form.set("code", code);
  form.set("redirect_uri", redirectUri);
  form.set("client_id", process.env[def.envClientId]!);
  form.set("client_secret", process.env[def.envClientSecret]!);

  let tokenJson: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    realmId?: string;
  } = {};
  try {
    const resp = await fetch(def.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    tokenJson = await resp.json();
    if (!resp.ok || !tokenJson.access_token) {
      return NextResponse.json(
        { error: "Token exchange failed" },
        { status: 502 }
      );
    }
    // Bound the provider response so a malicious or buggy IdP can't
    // dump megabytes into the connection row.
    if (
      tokenJson.access_token.length > MAX_OAUTH_TOKEN_CHARS ||
      (tokenJson.refresh_token != null &&
        tokenJson.refresh_token.length > MAX_OAUTH_TOKEN_CHARS)
    ) {
      console.error("[integrations/callback] oversized token from provider", {
        provider,
      });
      return NextResponse.json(
        { error: "Provider returned an unusable token." },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Token exchange network error" },
      { status: 502 }
    );
  }

  const tokenExpiresAt = tokenJson.expires_in
    ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
    : null;

  const admin = createAdminClient();
  await admin.from("integration_connections").upsert(
    {
      business_id: business.id,
      provider: provider as ProviderId,
      external_account_id: tokenJson.realmId ?? null,
      access_token_cipher: tokenJson.access_token,
      refresh_token_cipher: tokenJson.refresh_token ?? null,
      token_expires_at: tokenExpiresAt,
      scopes: def.scopes,
      status: "active",
      connected_by: user.id,
    },
    { onConflict: "business_id,provider" }
  );

  const resp = NextResponse.redirect(`${appUrl}/settings/integrations`);
  resp.cookies.delete(`oauth_state_${provider}`);
  return resp;
}
