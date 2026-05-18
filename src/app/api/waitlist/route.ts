import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { buildWaitlistConfirmation } from "@/lib/email-templates/waitlist-confirmation";
import { consumeRateLimit, hashIp } from "@/lib/security/rate-limit";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase environment variables not configured");
  }
  return createClient(url, key);
}

function strOrNull(value: unknown, maxLen = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : null;
}

const VALID_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
  "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR",
  "PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]);

export async function POST(req: NextRequest) {
  // IP-keyed throttle keeps a single client from flooding signups / triggering
  // Resend sends. 5 attempts per hour per source IP is plenty for legitimate
  // use (a user re-submitting the form).
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "0.0.0.0";
  const allowed = await consumeRateLimit(`waitlist:${hashIp(ip)}`, 5, 3600);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("email" in body) ||
    typeof (body as Record<string, unknown>).email !== "string"
  ) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const email = (record.email as string).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const stateRaw = strOrNull(record.state, 4);
  const state = stateRaw && VALID_STATES.has(stateRaw.toUpperCase()) ? stateRaw.toUpperCase() : null;
  const referredBy = strOrNull(record.referred_by, 32);

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  const { data: inserted, error } = await supabase
    .from("waitlist_signups")
    .insert({
      email,
      signed_up_at: new Date().toISOString(),
      utm_source: strOrNull(record.utm_source),
      utm_medium: strOrNull(record.utm_medium),
      utm_campaign: strOrNull(record.utm_campaign),
      referrer: strOrNull(record.referrer),
      landing_path: strOrNull(record.landing_path),
      state,
      industry_slug: strOrNull(record.industry_slug, 48),
      referred_by_code: referredBy,
    })
    .select("referral_code")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Already on list — fetch existing referral_code so they can still share.
      const { data: existing } = await supabase
        .from("waitlist_signups")
        .select("referral_code")
        .eq("email", email)
        .maybeSingle();
      return NextResponse.json({
        success: true,
        already_signed_up: true,
        referral_code: existing?.referral_code ?? null,
      });
    }
    return NextResponse.json(
      { error: "Failed to save signup. Please try again." },
      { status: 500 }
    );
  }

  // Fire-and-forget confirmation email. Failure does not block the response.
  if (process.env.RESEND_API_KEY && inserted?.referral_code) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const referralLink = `${appUrl}/?ref=${inserted.referral_code}`;
    const { subject, html } = buildWaitlistConfirmation({
      referralLink,
      state,
    });
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      void resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@operatoros.com",
        to: email,
        subject,
        html,
      });
      void supabase
        .from("waitlist_signups")
        .update({ confirmation_sent_at: new Date().toISOString() })
        .eq("email", email);
    } catch {
      // best-effort
    }
  }

  return NextResponse.json({
    success: true,
    referral_code: inserted?.referral_code ?? null,
  });
}
