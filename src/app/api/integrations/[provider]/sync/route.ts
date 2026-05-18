import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROVIDERS, type ProviderId } from "@/lib/integrations/providers";
import { syncProvider } from "@/lib/integrations/sync";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { INTEGRATIONS_SYNC_LIMIT } from "@/lib/security/rate-limits";
import { entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Trigger a sync for the connected provider. Owner-only — RLS on the
 * connection row would block anyway, but we double-check.
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider } = await ctx.params;
  if (!(provider in PROVIDERS)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan_tier")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // External-provider OAuth integrations are a paid-tier feature — Lite
  // and Free should not be able to spin up integration cost.
  const ents = entitlementsFor(business.plan_tier);
  if (!ents.ai) {
    return NextResponse.json(
      {
        error: "Integration sync requires a paid plan.",
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

  // Cap inbound sync requests at 6/hour per (business, provider). External
  // partner APIs charge per call; this stops a tight loop from running
  // up cost or tripping the provider's rate-limit on our shared client.
  const allowed = await consumeRateLimit(
    `integrations-sync:${business.id}:${provider}`,
    INTEGRATIONS_SYNC_LIMIT.max,
    INTEGRATIONS_SYNC_LIMIT.windowSeconds
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Sync rate-limit reached. Try again later." },
      { status: 429 }
    );
  }

  const result = await syncProvider(business.id, provider as ProviderId);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
