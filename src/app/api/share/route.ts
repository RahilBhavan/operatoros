import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: token, error } = await supabase
    .from("share_tokens")
    .insert({
      business_id: business.id,
      expires_at: expiresAt,
      label,
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (error || !token) {
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/share/${token.token}`;
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
    .select("id, token, label, expires_at, view_count, last_viewed_at, revoked_at, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const links = (tokens ?? []).map((t) => ({
    id: t.id,
    label: t.label,
    url: `${appUrl}/share/${t.token}`,
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
