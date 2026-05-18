import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/security/token-hash";
import { SHARE_TOKEN_LIMIT } from "@/lib/security/rate-limits";

const EXPIRY_DAYS = new Set([7, 30, 90, 365]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan_tier, billing_status")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const isEligible =
    business.billing_status === "active" ||
    business.billing_status === "trialing";

  const hasPlan =
    business.plan_tier === "business" || business.plan_tier === "accountant";

  if (!isEligible || !hasPlan) {
    return NextResponse.json(
      { error: "Upgrade to a paid plan to use shareable links" },
      { status: 403 }
    );
  }

  // IP/user rate limit: 20 share-link creates per hour per user. Keeps a
  // compromised session from minting unlimited public links.
  const adminForRate = createAdminClient();
  const rateRpc = adminForRate.rpc as unknown as (
    fn: "try_consume_auth_rate_limit",
    params: { p_key: string; p_max_attempts: number; p_window_seconds: number }
  ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  const { data: rateAllowed, error: rateError } = await rateRpc(
    "try_consume_auth_rate_limit",
    {
      p_key: `share:create:${user.id}`,
      p_max_attempts: SHARE_TOKEN_LIMIT.max,
      p_window_seconds: SHARE_TOKEN_LIMIT.windowSeconds,
    }
  );
  if (rateError) {
    console.error("[share] rate-limit RPC failed", rateError.message);
    // Fail-open on RPC error — Supabase plan throttle is the backstop.
  } else if (rateAllowed === false) {
    return NextResponse.json(
      { error: "Too many share links created. Try again in an hour." },
      { status: 429 }
    );
  }

  let body: { label?: string; expiry_days?: number } = {};
  try {
    body = await req.json();
  } catch {
    // body is optional; defaults apply
  }

  const expiryDays = EXPIRY_DAYS.has(Number(body.expiry_days))
    ? Number(body.expiry_days)
    : 30;

  const label = typeof body.label === "string" ? body.label.slice(0, 120) : null;
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  // Generate plaintext in app code so we can return it once. The DB only
  // stores sha256(plaintext) — the plaintext column was dropped in
  // 20260517000002_audit_remediation.
  const plaintextToken = randomBytes(24).toString("hex");
  const tokenHash = hashToken(plaintextToken);

  // Cast: generated supabase types haven't regenerated for the new
  // token_hash column added in 20260517000002_audit_remediation.
  const { data: token, error } = await supabase
    .from("share_tokens")
    .insert({
      business_id: business.id,
      expires_at: expiresAt,
      label,
      created_by_user_id: user.id,
      token_hash: tokenHash,
    } as never)
    .select("id, label, expires_at")
    .single();

  if (error || !token) {
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/share/${plaintextToken}`;
  return NextResponse.json({
    id: token.id,
    url,
    label: token.label,
    expires_at: token.expires_at,
    view_count: 0,
  });
}

// List active share tokens for the owner — drives the share-management surface.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ links: [] });

  const { data: tokens } = await supabase
    .from("share_tokens")
    .select("id, label, expires_at, view_count, last_viewed_at, revoked_at, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Plaintext token is no longer recoverable post-issue (column dropped); the
  // URL field is omitted from listings. UI surfaces metadata only and can
  // offer a "create new link" affordance for callers that need to reshare.
  const links = (tokens ?? []).map((t) => ({
    id: t.id,
    label: t.label,
    url: null as string | null,
    expires_at: t.expires_at,
    view_count: t.view_count,
    last_viewed_at: t.last_viewed_at,
    revoked: !!t.revoked_at,
    created_at: t.created_at,
  }));

  return NextResponse.json({ links });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { error } = await supabase
    .from("share_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return NextResponse.json({ error: "Revoke failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
