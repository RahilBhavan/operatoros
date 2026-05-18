import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbError } from "@/lib/api/respond";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePlatformAdminForRoute();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("waitlist_signups")
    .select("id, email, state, invited_at, referral_code")
    .eq("id", id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.invited_at)
    return NextResponse.json({ ok: true, already_invited: true });

  const now = new Date().toISOString();

  const { error } = await admin
    .from("waitlist_signups")
    .update({ invited_at: now })
    .eq("id", id);
  if (error) return dbError("admin:waitlist/invite", error);

  // Best-effort early-access email.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@operatoros.com",
        to: row.email,
        subject: "You're off the OperatorOS waitlist — early access is open",
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <p style="color:#475569;">Hi,</p>
            <p style="color:#475569;">
              You've been invited off the OperatorOS waitlist for <strong>${row.state ?? "your region"}</strong>.
              Your account is ready — sign up with this email to get started.
            </p>
            <p style="margin: 24px 0;">
              <a href="${appUrl}/sign-up" style="background:#2563eb;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Start your 14-day trial</a>
            </p>
            <p style="font-size:12px;color:#94a3b8;">
              No credit card required. You can keep your referral link active for friends —
              ${appUrl}/?ref=${row.referral_code}
            </p>
          </div>
        `,
      });
    } catch {
      // best-effort; we've already flagged invited_at
    }
  }

  // Platform-level event: waitlist row isn't tied to a business yet.
  // audit_events.business_id was made nullable specifically so we can log
  // these without inventing a sentinel tenant.
  const { writeAuditEvent } = await import("@/lib/audit-log");
  await writeAuditEvent(admin, {
    business_id: null,
    actor_user_id: auth.user.id,
    event_type: "platform.waitlist_invited",
    target_id: id,
    metadata: {
      email: row.email,
      state: row.state,
      email_sent: !!process.env.RESEND_API_KEY,
    },
  });

  return NextResponse.json({ ok: true });
}
