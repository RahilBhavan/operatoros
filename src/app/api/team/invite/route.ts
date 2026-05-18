import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/security/token-hash";
import { Resend } from "resend";
import { z } from "zod";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

const InviteSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(["admin", "member"]).default("member"),
});

const ACCEPT_WINDOW_DAYS = 14;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const { email, role } = parsed.data;
  const normalized = email.trim().toLowerCase();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, owner_id")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data: myMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .single();

  if (myMembership?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const admin = createAdminClient();
  const inviteToken = randomBytes(24).toString("hex");
  const inviteTokenHash = hashToken(inviteToken);
  const expiresAt = new Date(
    Date.now() + ACCEPT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Security: never store the requested role on the pending row.
  //
  // memberships_admin_all RLS keys off role='admin' AND user_id=auth.uid().
  // Previously this route set user_id = inviter.id as a NOT-NULL placeholder
  // AND wrote the intended role, which meant a demoted inviter could still
  // satisfy that policy via the orphan pending row (the M-series audit
  // finding). Workaround in app code: pin pending rows to role='member' and
  // promote at accept time. The intended role rides along in audit_events
  // metadata so the accept handler can read it back.
  //
  // Future cleanup (non-blocking): when a follow-on migration makes
  // memberships.user_id nullable, drop the placeholder + role pin entirely.
  // Today's workaround is the audited fix for the M-series finding.
  const pendingRole = "member" as const;

  const { data: existing } = await admin
    .from("memberships")
    .select("id")
    .eq("business_id", business.id)
    .eq("invited_email", normalized)
    .eq("status", "pending")
    .maybeSingle();

  let membershipId: string | null = existing?.id ?? null;

  // Casts: generated supabase types haven't regenerated for the new
  // invite_token_hash column added in 20260517000002_audit_remediation.
  if (existing) {
    const { error: upErr } = await admin
      .from("memberships")
      .update({
        invite_token_hash: inviteTokenHash,
        invite_expires_at: expiresAt,
        role: pendingRole,
      } as never)
      .eq("id", existing.id);
    if (upErr) return NextResponse.json({ error: "Failed to refresh invite" }, { status: 500 });
  } else {
    const { data: inserted, error: insErr } = await admin
      .from("memberships")
      .insert({
        business_id: business.id,
        user_id: user.id, // placeholder until accept; safe because role!='admin'
        invited_email: normalized,
        role: pendingRole,
        status: "pending",
        invite_token_hash: inviteTokenHash,
        invite_expires_at: expiresAt,
      } as never)
      .select("id")
      .single();
    if (insErr || !inserted) {
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }
    membershipId = inserted.id;
  }

  const { writeAuditEvent } = await import("@/lib/audit-log");
  await writeAuditEvent(admin, {
    business_id: business.id,
    actor_user_id: user.id,
    event_type: "team.invite_sent",
    target_id: membershipId,
    metadata: { email: normalized, role },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const acceptUrl = `${appUrl}/invite/${inviteToken}/accept`;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@operatoros.com",
      to: normalized,
      subject: `You're invited to join ${business.name} on OperatorOS`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <p style="color: #475569;">Hi,</p>
          <p style="color: #475569;">
            <strong>${business.name}</strong> has invited you to join their compliance dashboard on OperatorOS as a <strong>${role}</strong>.
          </p>
          <p style="margin: 24px 0;">
            <a href="${acceptUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Accept invite</a>
          </p>
          <p style="font-size: 12px; color: #94a3b8;">
            This invite expires on ${new Date(expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
            If you didn't expect this email, you can ignore it.
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({
    ok: true,
    invite_token: inviteToken,
    expires_at: expiresAt,
    accept_url: acceptUrl,
  });
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

  const { data: myMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .single();

  if (myMembership?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("memberships")
    .update({ status: "revoked", invite_token_hash: null } as never)
    .eq("id", id)
    .eq("business_id", business.id)
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: "Revoke failed" }, { status: 500 });

  const { writeAuditEvent: writeAuditEvent2 } = await import("@/lib/audit-log");
  await writeAuditEvent2(admin, {
    business_id: business.id,
    actor_user_id: user.id,
    event_type: "team.invite_revoked",
    target_id: id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
