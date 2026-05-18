import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { AI_SHARE_ACCOUNTANT_LIMIT } from "@/lib/security/rate-limits";
import { entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * WS-1.4 "share with my accountant" — emails an AI insight to the active
 * accountant on file for this business. Fire-and-forget pattern (the
 * accountant_connections row already implies consent). If no accountant is
 * connected, returns 409 with a hint to invite one first.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 10 share emails per user per hour. Prevents an authenticated tenant
  // from spamming Resend to the accountant on file.
  const allowed = await consumeRateLimit(
    `ai-share-accountant:${user.id}`,
    AI_SHARE_ACCOUNTANT_LIMIT.max,
    AI_SHARE_ACCOUNTANT_LIMIT.windowSeconds
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many share attempts. Try again in an hour." },
      { status: 429 }
    );
  }

  let body: {
    title?: unknown;
    body?: unknown;
    agency?: unknown;
    source_url?: unknown;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.slice(0, 200) : "";
  const insightBody =
    typeof body.body === "string" ? body.body.slice(0, 2000) : "";
  const agency =
    typeof body.agency === "string" ? body.agency.slice(0, 100) : "";
  const sourceUrl =
    typeof body.source_url === "string" &&
    body.source_url.startsWith("https://")
      ? body.source_url.slice(0, 500)
      : null;

  if (!title || !insightBody) {
    return NextResponse.json(
      { error: "Title and body are required." },
      { status: 400 }
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, plan_tier")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Share-with-accountant is a paid-tier surface (the accountant portal
  // bundle). Mirrors the gate on /api/ai/compliance-insights.
  const ents = entitlementsFor(business.plan_tier);
  if (!ents.accountantPortal) {
    return NextResponse.json(
      {
        error: "Sharing with an accountant requires a paid plan.",
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

  // Use admin client for the connection lookup so RLS doesn't get in the way
  // on the email field.
  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("accountant_connections")
    .select("accountant_email, accountant_name, revoked_at, expires_at")
    .eq("business_id", business.id)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!connection) {
    return NextResponse.json(
      {
        error:
          "No active accountant connection. Invite an accountant from the dashboard first.",
      },
      { status: 409 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "OperatorOS <reminders@operatoros.com>";
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(insightBody);
  const safeAgency = escapeHtml(agency);
  const safeBusiness = escapeHtml(business.name);
  const accountantGreeting = connection.accountant_name
    ? escapeHtml(connection.accountant_name)
    : "there";

  const subject = `Compliance flag for ${business.name}: ${title}`;
  const sourceBlock = sourceUrl
    ? `<p style="margin: 12px 0 0; font-size: 13px; color: #475569;">Source: <a href="${sourceUrl}" style="color: #2563eb;">${escapeHtml(sourceUrl)}</a></p>`
    : "";
  const agencyBlock = safeAgency
    ? `<p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">${safeAgency}</p>`
    : "";

  try {
    const { error } = await resend.emails.send({
      from,
      to: connection.accountant_email,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <div style="margin-bottom: 20px;">
            <span style="font-weight: 700; font-size: 18px; color: #1e293b;">OperatorOS</span>
          </div>
          <p style="color: #475569; margin: 0 0 12px;">Hi ${accountantGreeting},</p>
          <p style="color: #475569; margin: 0 0 12px;">
            ${safeBusiness} flagged this compliance insight for your review.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 12px 0;">
            ${agencyBlock}
            <p style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #0f172a;">${safeTitle}</p>
            <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.55;">${safeBody}</p>
            ${sourceBlock}
          </div>
          <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; margin: 16px 0 0;">
            AI-surfaced suggestion from OperatorOS. Verify against the responsible agency before acting.
          </p>
        </div>
      `,
    });
    if (error) {
      console.error("[ai-share-with-accountant] resend error", error);
      return NextResponse.json(
        { error: "Failed to send email." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[ai-share-with-accountant] send failed", err);
    return NextResponse.json(
      { error: "Failed to send email." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    sent_to: connection.accountant_email,
  });
}
