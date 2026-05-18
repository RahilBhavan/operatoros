import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import {
  PROVIDERS,
  isProviderConfigured,
  type ProviderId,
} from "@/lib/integrations/providers";
import { entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";

/**
 * Kick off the OAuth flow for a configured provider. Generates a CSRF
 * state cookie, redirects to the provider's auth endpoint.
 *
 * Providers without authUrl (SimplePractice, Karbon, TaxDome — pending
 * developer-app approval) return 503 with a clear message. Once those
 * partnerships land, fill in authUrl/tokenUrl in providers.ts and this
 * route works without further changes.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", _req.url));
  }

  if (!(provider in PROVIDERS)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }
  const def = PROVIDERS[provider as ProviderId];

  if (!isProviderConfigured(def)) {
    return NextResponse.json(
      { error: "Provider credentials not configured on this deployment" },
      { status: 503 }
    );
  }

  if (!def.authUrl) {
    return NextResponse.json(
      {
        error:
          "OAuth endpoint not yet available for this provider — partnership pending.",
      },
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

  const ents = entitlementsFor(business.plan_tier);
  if (!ents.ai) {
    return NextResponse.json(
      { error: "Integrations require a paid plan." },
      { status: 403 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(_req.url).origin;
  const redirectUri = `${appUrl}/api/integrations/${provider}/callback`;

  const url = new URL(def.authUrl);
  url.searchParams.set("client_id", process.env[def.envClientId]!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", def.scopes.join(" "));
  url.searchParams.set("state", state);

  const resp = NextResponse.redirect(url.toString());
  resp.cookies.set({
    name: `oauth_state_${provider}`,
    value: state,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return resp;
}
