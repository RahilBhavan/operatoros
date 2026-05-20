import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email";
import { isSmsConfigured, sendSms } from "@/lib/sms";
import { sendSlack } from "@/lib/slack";
import { track } from "@/lib/analytics";
import { computeRiskWeightedScore, computeAutoStatus } from "@/lib/deadline-utils";
import { getAppUrl } from "@/lib/app-url";

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

function inQuietHours(
  now: Date,
  start: string | null,
  end: string | null
): boolean {
  if (!start || !end) return false;
  const hhmm = `${String(now.getUTCHours()).padStart(2, "0")}:${String(
    now.getUTCMinutes()
  ).padStart(2, "0")}`;
  // Window wraps midnight if end < start (e.g. 22:00 → 07:00).
  if (start <= end) return hhmm >= start && hhmm < end;
  return hhmm >= start || hhmm < end;
}

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

  const appUrl = getAppUrl();

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

        // WS-E — track each reminder for funnel reporting.
        void track({
          distinctId: deadline.business_id,
          event: "reminder_sent",
          properties: {
            channel: "email",
            severity: deadline.severity_tier ?? "medium",
            days_until_due: days,
            reminder_type: type,
          },
          groups: { business: deadline.business_id },
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

  // WS-1.1 — SMS fan-out alongside email. Only T-7 / T-1 windows; SMS at
  // 30+ days is noisy. Gated on Twilio env vars + per-user opt-in with TCPA
  // ack recorded.
  let smsSent = 0;
  let smsErrors = 0;
  if (isSmsConfigured()) {
    const smsOwnerIds = [
      ...new Set(
        deadlines
          .map((d) => {
            const biz = Array.isArray(d.businesses) ? d.businesses[0] : d.businesses;
            return biz?.owner_id;
          })
          .filter(Boolean) as string[]
      ),
    ];

    const { data: smsPrefRows } = await supabase
      .from("notification_preferences")
      .select(
        "user_id, sms_enabled, phone_number, phone_verified_at, sms_severity_threshold, quiet_hours_start, quiet_hours_end, tcpa_opted_in_at"
      )
      .in("user_id", smsOwnerIds);

    const smsPrefByOwner = new Map<
      string,
      NonNullable<typeof smsPrefRows>[number]
    >();
    for (const p of smsPrefRows ?? []) smsPrefByOwner.set(p.user_id, p);

    for (const deadline of deadlines) {
      const business = Array.isArray(deadline.businesses)
        ? deadline.businesses[0]
        : deadline.businesses;
      if (!business) continue;
      const isEligible =
        business.billing_status === "active" ||
        business.billing_status === "trialing";
      const hasPremiumPlan =
        business.plan_tier === "business" ||
        business.plan_tier === "accountant";
      if (!isEligible || !hasPremiumPlan) continue;

      // Match the dueDate against the same windows. SMS only at T-7 / T-1.
      const target = targetDates.find((t) => t.dateStr === deadline.due_date);
      if (!target) continue;
      if (target.type !== "7_day" && target.type !== "1_day") continue;

      const prefs = smsPrefByOwner.get(business.owner_id);
      if (!prefs) continue;
      if (!prefs.sms_enabled) continue;
      if (!prefs.tcpa_opted_in_at) continue;
      if (!prefs.phone_number) continue;

      const sevRank =
        SEVERITY_RANK[deadline.severity_tier ?? "medium"] ?? 0;
      const thresholdRank =
        SEVERITY_RANK[prefs.sms_severity_threshold ?? "high"] ?? 3;
      if (sevRank < thresholdRank) continue;

      if (
        inQuietHours(
          now,
          prefs.quiet_hours_start,
          prefs.quiet_hours_end
        )
      ) {
        continue;
      }

      // Idempotency: re-use reminder_log keys for SMS by suffixing the type.
      if (sentSet.has(`${deadline.id}:sms-${target.type}`)) continue;

      const days = REMINDER_WINDOWS.find((w) => w.type === target.type)?.days ?? 0;
      const body = `OperatorOS: "${deadline.name}" due in ${days} day${days === 1 ? "" : "s"} (${deadline.due_date}). Reply STOP to end.`;
      const result = await sendSms({
        toPhone: prefs.phone_number,
        body,
        userId: business.owner_id,
        businessId: deadline.business_id,
        kind: "reminder",
      });
      if (result.ok) {
        smsSent++;
        await supabase.from("reminder_log").insert({
          deadline_id: deadline.id,
          business_id: deadline.business_id,
          // Cast: the generated supabase types still constrain reminder_type
          // to the email-only values from 20260513000004_billing.sql; the
          // 20260518000011_reminder_log_sms migration extends the CHECK to
          // accept sms-* prefixes but types haven't been regenerated.
          reminder_type: `sms-${target.type}` as ReminderType,
          recipient_email: prefs.phone_number,
          status: "sent",
        });
        // WS-E — funnel signal for SMS channel.
        void track({
          distinctId: deadline.business_id,
          event: "reminder_sent",
          properties: {
            channel: "sms",
            severity: deadline.severity_tier ?? "medium",
            days_until_due: days,
            reminder_type: target.type,
          },
          groups: { business: deadline.business_id },
        });
      } else {
        smsErrors++;
      }
    }
  }

  // WS-G.Slack — Slack fan-out alongside email/SMS. Webhook-URL flow, no
  // OAuth needed. Threshold + quiet hours follow the same shape as SMS so
  // the user's existing preference mental model carries over.
  let slackSent = 0;
  let slackErrors = 0;
  {
    const slackOwnerIds = [
      ...new Set(
        deadlines
          .map((d) => {
            const biz = Array.isArray(d.businesses) ? d.businesses[0] : d.businesses;
            return biz?.owner_id;
          })
          .filter(Boolean) as string[]
      ),
    ];

    if (slackOwnerIds.length > 0) {
      // Cast: slack_* columns landed in 20260518000017 and types haven't
      // been regenerated. Select shape is structurally safe per the migration.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prefsTable = supabase.from("notification_preferences") as any;
      const slackPrefRows = await prefsTable
        .select(
          "user_id, slack_enabled, slack_webhook_url, slack_severity_threshold, quiet_hours_start, quiet_hours_end"
        )
        .in("user_id", slackOwnerIds);

      type SlackPref = {
        user_id: string;
        slack_enabled: boolean;
        slack_webhook_url: string | null;
        slack_severity_threshold:
          | "critical" | "high" | "medium" | "low" | "info";
        quiet_hours_start: string | null;
        quiet_hours_end: string | null;
      };
      const slackPrefByOwner = new Map<string, SlackPref>();
      for (const p of ((slackPrefRows as { data: SlackPref[] | null }).data ?? [])) {
        slackPrefByOwner.set(p.user_id, p);
      }

      for (const deadline of deadlines) {
        const business = Array.isArray(deadline.businesses)
          ? deadline.businesses[0]
          : deadline.businesses;
        if (!business) continue;
        const isEligible =
          business.billing_status === "active" ||
          business.billing_status === "trialing";
        if (!isEligible) continue;

        const target = targetDates.find((t) => t.dateStr === deadline.due_date);
        if (!target) continue;
        if (target.type !== "7_day" && target.type !== "1_day") continue;

        const prefs = slackPrefByOwner.get(business.owner_id);
        if (!prefs) continue;
        if (!prefs.slack_enabled) continue;
        if (!prefs.slack_webhook_url) continue;

        const sevRank =
          SEVERITY_RANK[deadline.severity_tier ?? "medium"] ?? 0;
        const thresholdRank =
          SEVERITY_RANK[prefs.slack_severity_threshold ?? "high"] ?? 3;
        if (sevRank < thresholdRank) continue;

        if (
          inQuietHours(
            now,
            prefs.quiet_hours_start,
            prefs.quiet_hours_end
          )
        ) {
          continue;
        }

        if (sentSet.has(`${deadline.id}:slack-${target.type}`)) continue;

        const days =
          REMINDER_WINDOWS.find((w) => w.type === target.type)?.days ?? 0;
        const sev = deadline.severity_tier ?? "medium";
        const text = `OperatorOS — "${deadline.name}" due in ${days} day${days === 1 ? "" : "s"} (${deadline.due_date}) · ${sev}`;

        const result = await sendSlack({
          webhookUrl: prefs.slack_webhook_url,
          text,
          userId: business.owner_id,
          businessId: deadline.business_id,
          kind: "reminder",
        });

        if (result.ok) {
          slackSent++;
          await supabase.from("reminder_log").insert({
            deadline_id: deadline.id,
            business_id: deadline.business_id,
            reminder_type: `slack-${target.type}` as ReminderType,
            recipient_email: "slack:webhook",
            status: "sent",
          });
          void track({
            distinctId: deadline.business_id,
            event: "reminder_sent",
            properties: {
              channel: "slack",
              severity: sev,
              days_until_due: days,
              reminder_type: target.type,
            },
            groups: { business: deadline.business_id },
          });
        } else {
          slackErrors++;
        }
      }
    }
  }

  await snapshotComplianceScores(supabase);

  // Daily housekeeping: refresh the rule_confidence materialised view (kept
  // fresh by admin moderation, but a once-a-day backstop covers rules that
  // haven't been touched) and prune old auth-rate-limit rows so the table
  // doesn't grow without bound under credential-stuffing attacks.
  const reminderRpc = supabase.rpc.bind(supabase) as unknown as (fn: string) => Promise<unknown>;
  await Promise.allSettled([
    reminderRpc("refresh_rule_confidence"),
    reminderRpc("cleanup_auth_rate_limits"),
  ]);

  return NextResponse.json({
    processed,
    errors,
    sms_sent: smsSent,
    sms_errors: smsErrors,
    slack_sent: slackSent,
    slack_errors: slackErrors,
    timestamp: nowIso,
  });
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
