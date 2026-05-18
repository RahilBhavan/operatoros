import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/security/token-hash";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { ACCOUNTANT_INVITE_LIMIT } from "@/lib/security/rate-limits";
import { Resend } from "resend";

const ELIGIBLE_PLANS = ["business", "accountant"] as const;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit token rotation per owner. Without this, a compromised owner
  // session could spam invites to harvest portal tokens, and a logged-in
  // owner can hammer the Resend send path.
  const allowed = await consumeRateLimit(
    `accountant-invite:${user.id}`,
    ACCOUNTANT_INVITE_LIMIT.max,
    ACCOUNTANT_INVITE_LIMIT.windowSeconds
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many invites. Try again in an hour." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const accountantEmail = (body.accountant_email as string | undefined)?.trim().toLowerCase();
  const accountantName = (body.accountant_name as string | undefined)?.trim();

  if (!accountantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountantEmail)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, plan_tier, billing_status")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const isEligible =
    ELIGIBLE_PLANS.includes(business.plan_tier as (typeof ELIGIBLE_PLANS)[number]) &&
    (business.billing_status === "active" || business.billing_status === "trialing");

  if (!isEligible) {
    return NextResponse.json(
      { error: "Accountant portal requires a paid plan" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // Always issue a fresh plaintext token. On re-invite we rotate — the old
  // plaintext is unrecoverable (only its hash is on disk), so we cannot and
  // must not return it. This closes the M5 audit finding where re-inviting
  // an existing accountant returned the same long-lived token.
  const plaintextToken = randomBytes(24).toString("hex");
  const tokenHash = hashToken(plaintextToken);

  const { data: existing } = await admin
    .from("accountant_connections")
    .select("id")
    .eq("business_id", business.id)
    .eq("accountant_email", accountantEmail)
    .maybeSingle();

  // Cast on update/insert: generated supabase types haven't regenerated for
  // the new token_hash column added in 20260517000002_audit_remediation.
  let connectionId: string;
  if (existing) {
    const { error: upErr } = await admin
      .from("accountant_connections")
      .update({
        token_hash: tokenHash,
        accountant_name: accountantName ?? null,
        revoked_at: null,
      } as never)
      .eq("id", existing.id);
    if (upErr) {
      return NextResponse.json({ error: "Failed to rotate token" }, { status: 500 });
    }
    connectionId = existing.id;
  } else {
    const { data: connection, error } = await admin
      .from("accountant_connections")
      .insert({
        business_id: business.id,
        accountant_email: accountantEmail,
        accountant_name: accountantName ?? null,
        token_hash: tokenHash,
      } as never)
      .select("id")
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: "Failed to create connection" }, { status: 500 });
    }
    connectionId = connection.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const portalUrl = `${appUrl}/accountant/${plaintextToken}`;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@operatoros.com",
      to: accountantEmail,
      subject: `${business.name} shared their compliance dashboard with you`,
      html: `
        <p>Hi ${accountantName ?? "there"},</p>
        <p><strong>${business.name}</strong> has shared their compliance dashboard with you via OperatorOS.</p>
        <p>View their live compliance status here:</p>
        <p><a href="${portalUrl}" style="background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View Compliance Dashboard</a></p>
        <p style="color:#64748b;font-size:12px;">This link gives you read-only access to their compliance calendar and score.</p>
      `,
    });
  }

  // Return the plaintext token EXACTLY ONCE — the DB only has the hash.
  return NextResponse.json({
    token: plaintextToken,
    portal_url: portalUrl,
    connection_id: connectionId,
  });
}
