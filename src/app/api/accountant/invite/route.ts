import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Upsert: if this email already has access, return existing token
  const { data: existing } = await admin
    .from("accountant_connections")
    .select("id, token")
    .eq("business_id", business.id)
    .eq("accountant_email", accountantEmail)
    .single();

  if (existing) {
    return NextResponse.json({ token: existing.token, already_exists: true });
  }

  const { data: connection, error } = await admin
    .from("accountant_connections")
    .insert({
      business_id: business.id,
      accountant_email: accountantEmail,
      accountant_name: accountantName ?? null,
    })
    .select("token")
    .single();

  if (error || !connection) {
    return NextResponse.json({ error: "Failed to create connection" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const portalUrl = `${appUrl}/accountant/${connection.token}`;

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

  return NextResponse.json({ token: connection.token, portal_url: portalUrl });
}
