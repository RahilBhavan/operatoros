import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/security/token-hash";
import { dbError } from "@/lib/api/respond";

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
  // Plaintext is generated in-process and returned once; only the hash hits
  // the DB. token column was dropped in 20260517000002_audit_remediation.
  const plaintextToken = randomBytes(24).toString("hex");
  const tokenHash = hashToken(plaintextToken);

  // Cast: generated supabase types haven't regenerated for the new
  // token_hash column added in 20260517000002_audit_remediation.
  const { data: invite, error } = await admin
    .from("platform_admin_invites")
    .insert({
      invited_email: normalized,
      created_by: auth.user.id,
      token_hash: tokenHash,
    } as never)
    .select("id, expires_at")
    .single();
  if (error || !invite) {
    return dbError("admin:invites/create", error);
  }

  return NextResponse.json({
    ok: true,
    invite_id: invite.id,
    accept_url: `/admin-accept/${plaintextToken}`,
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
  if (error) return dbError("admin:invites/revoke", error);

  return NextResponse.json({ ok: true });
}
