import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email";
import { computeRiskWeightedScore, computeAutoStatus } from "@/lib/deadline-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeBearerCompare(authHeader: string | null, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  const provided = authHeader ?? "";
  // Early-out on length mismatch — timingSafeEqual throws on unequal lengths
  // and the length difference itself isn't sensitive.
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

const REMINDER_WINDOWS = [
  { days: 90, type: "90_day" },
  { days: 60, type: "60_day" },
  { days: 30, type: "30_day" },
  { days: 7, type: "7_day" },
  { days: 1, type: "1_day" },
] as const;

type ReminderType = (typeof REMINDER_WINDOWS)[number]["type"];

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (!safeBearerCompare(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.VERCEL === "1") {
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua.includes("vercel-cron")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const targetDates = REMINDER_WINDOWS.map(({ days, type }) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return { type, dateStr: d.toISOString().split("T")[0] };
  });

  const dateStrings = targetDates.map((t) => t.dateStr);

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select(
      `id, name, due_date, business_id, governing_agency, severity_tier, penalty_estimate_cents, statute_citation, source_url,
       businesses!inner (
         id, name, owner_id, billing_status, plan_tier
       )`
    )
    .in("due_date", dateStrings)
    .neq("status", "compliant");

  if (!deadlines?.length) {
    return NextResponse.json({ processed: 0, errors: 0, timestamp: nowIso });
  }

  const deadlineIds = deadlines.map((d) => d.id);
  const businessIds = [
    ...new Set(deadlines.map((d) => d.business_id).filter(Boolean) as string[]),
  ];

  const [{ data: sentLogs }, { data: prefRows }] = await Promise.all([
    supabase
      .from("reminder_log")
      .select("deadline_id, reminder_type")
      .in("deadline_id", deadlineIds)
      .eq("status", "sent"),
    supabase
      .from("reminder_preferences")
      .select("business_id, email_enabled, muted_until, unsubscribe_token")
      .in("business_id", businessIds),
  ]);

  const sentSet = new Set(
    (sentLogs ?? []).map((r) => `${r.deadline_id}:${r.reminder_type}`)
  );

  const prefByBusiness = new Map<
    string,
    { email_enabled: boolean; muted_until: string | null; unsubscribe_token: string }
  >();
  for (const p of prefRows ?? []) {
    prefByBusiness.set(p.business_id, {
      email_enabled: p.email_enabled,
      muted_until: p.muted_until,
      unsubscribe_token: p.unsubscribe_token,
    });
  }

  // Auto-provision preference rows for businesses that don't yet have one so
  // unsubscribe links work on the first reminder. Insert ignores conflicts.
  const missingPrefs = businessIds.filter((id) => !prefByBusiness.has(id));
  if (missingPrefs.length > 0) {
    const { data: inserted } = await supabase
      .from("reminder_preferences")
      .upsert(
        missingPrefs.map((id) => ({ business_id: id })),
        { onConflict: "business_id", ignoreDuplicates: false }
      )
      .select("business_id, email_enabled, muted_until, unsubscribe_token");
    for (const p of inserted ?? []) {
      prefByBusiness.set(p.business_id, {
        email_enabled: p.email_enabled,
        muted_until: p.muted_until,
        unsubscribe_token: p.unsubscribe_token,
      });
    }
  }

  const ownerIds = [
    ...new Set(
      deadlines.map((d) => {
        const biz = Array.isArray(d.businesses) ? d.businesses[0] : d.businesses;
        return biz?.owner_id;
      }).filter(Boolean) as string[]
    ),
  ];

  const emailMap = new Map<string, string>();
  await Promise.all(
    ownerIds.map(async (ownerId) => {
      const { data } = await supabase.auth.admin.getUserById(ownerId);
      if (data?.user?.email) emailMap.set(ownerId, data.user.email);
    })
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  let processed = 0;
  let errors = 0;

  const toInsert: Array<{
    deadline_id: string;
    business_id: string;
    reminder_type: ReminderType;
    recipient_email: string;
    status: "sent" | "failed";
  }> = [];

  for (const { type, dateStr, days } of targetDates.map((t, i) => ({
    ...t,
    days: REMINDER_WINDOWS[i].days,
  }))) {
    const windowDeadlines = deadlines.filter((d) => d.due_date === dateStr);
    if (!windowDeadlines.length) continue;

    const isPremiumReminder = type === "7_day" || type === "1_day";

    for (const deadline of windowDeadlines) {
      const business = Array.isArray(deadline.businesses)
        ? deadline.businesses[0]
        : deadline.businesses;
      if (!business) continue;

      const isEligible =
        business.billing_status === "active" ||
        business.billing_status === "trialing";
      if (!isEligible) continue;

      const hasPremiumPlan =
        business.plan_tier === "business" || business.plan_tier === "accountant";
      if (isPremiumReminder && !hasPremiumPlan) continue;

      if (sentSet.has(`${deadline.id}:${type}`)) continue;

      const prefs = prefByBusiness.get(deadline.business_id);
      if (prefs && !prefs.email_enabled) continue;
      if (prefs?.muted_until && new Date(prefs.muted_until).getTime() > now.getTime()) {
        continue;
      }

      const email = emailMap.get(business.owner_id);
      if (!email) continue;

      try {
        const trackingParams = new URLSearchParams({
          utm_source: "reminder",
          utm_medium: "email",
          utm_campaign: type,
        });
        const deadlineUrl = `${appUrl}/deadlines/${deadline.id}?${trackingParams}`;
        const unsubUrl = prefs
          ? `${appUrl}/unsubscribe/${prefs.unsubscribe_token}`
          : null;

        await sendReminderEmail({
          to: email,
          businessName: business.name,
          deadlineName: deadline.name,
          daysUntilDue: days,
          dueDate: new Date(deadline.due_date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          deadlineUrl,
          governingAgency: deadline.governing_agency,
          severity: deadline.severity_tier,
          penaltyEstimateCents: deadline.penalty_estimate_cents,
          statuteCitation: deadline.statute_citation,
          sourceUrl: deadline.source_url,
          unsubscribeUrl: unsubUrl,
        });

        toInsert.push({
          deadline_id: deadline.id,
          business_id: deadline.business_id,
          reminder_type: type as ReminderType,
          recipient_email: email,
          status: "sent",
        });

        processed++;
      } catch {
        toInsert.push({
          deadline_id: deadline.id,
          business_id: deadline.business_id,
          reminder_type: type as ReminderType,
          recipient_email: emailMap.get(business.owner_id) ?? "",
          status: "failed",
        });
        errors++;
      }
    }
  }

  if (toInsert.length > 0) {
    await supabase.from("reminder_log").insert(toInsert);
  }

  await snapshotComplianceScores(supabase);

  // Daily housekeeping: refresh the rule_confidence materialised view (kept
  // fresh by admin moderation, but a once-a-day backstop covers rules that
  // haven't been touched) and prune old auth-rate-limit rows so the table
  // doesn't grow without bound under credential-stuffing attacks.
  await Promise.allSettled([
    (supabase.rpc as unknown as (fn: string) => Promise<unknown>)("refresh_rule_confidence"),
    (supabase.rpc as unknown as (fn: string) => Promise<unknown>)("cleanup_auth_rate_limits"),
  ]);

  return NextResponse.json({ processed, errors, timestamp: nowIso });
}

async function snapshotComplianceScores(
  supabase: ReturnType<typeof createAdminClient>
) {
  const today = new Date().toISOString().split("T")[0];

  const [{ data: businesses }, { data: existing }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id")
      .in("billing_status", ["active", "trialing"]),
    supabase
      .from("compliance_score_history")
      .select("business_id")
      .gte("recorded_at", `${today}T00:00:00Z`)
      .lte("recorded_at", `${today}T23:59:59Z`),
  ]);

  if (!businesses?.length) return;

  const alreadySnapshotted = new Set((existing ?? []).map((e) => e.business_id));
  const pending = businesses.filter((b) => !alreadySnapshotted.has(b.id));
  if (!pending.length) return;

  const pendingIds = pending.map((b) => b.id);
  const { data: allDeadlines } = await supabase
    .from("deadlines")
    .select("business_id, status, due_date, severity_tier, penalty_estimate_cents")
    .in("business_id", pendingIds);

  if (!allDeadlines?.length) return;

  const byBusiness = new Map<string, typeof allDeadlines>();
  for (const d of allDeadlines) {
    const arr = byBusiness.get(d.business_id) ?? [];
    arr.push(d);
    byBusiness.set(d.business_id, arr);
  }

  const snapshots: Array<{ business_id: string; score: number }> = [];

  for (const biz of pending) {
    const deadlines = byBusiness.get(biz.id);
    if (!deadlines?.length) continue;
    snapshots.push({
      business_id: biz.id,
      score: computeRiskWeightedScore(deadlines, computeAutoStatus),
    });
  }

  if (snapshots.length > 0) {
    await supabase.from("compliance_score_history").insert(snapshots);
  }
}
