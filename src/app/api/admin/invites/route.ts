import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const InviteSchema = z.object({
  email: z.string().email().max(254),
});

export async function POST(req: NextRequest) {
  const auth = await requirePlatformAdminForRoute();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  const normalized = parsed.data.email.trim().toLowerCase();

  const admin = createAdminClient();
  const token = randomBytes(24).toString("hex");

  const { data: invite, error } = await admin
    .from("platform_admin_invites")
    .insert({
      invited_email: normalized,
      created_by: auth.user.id,
      token,
    })
    .select("id, token, expires_at")
    .single();
  if (error || !invite) {
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    invite_id: invite.id,
    accept_url: `/admin-accept/${invite.token}`,
    expires_at: invite.expires_at,
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePlatformAdminForRoute();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_admin_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("used_at", null);
  if (error) return NextResponse.json({ error: "Revoke failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
