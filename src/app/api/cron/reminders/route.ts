import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email";
import { computeComplianceScore, computeAutoStatus } from "@/lib/deadline-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // On Vercel, cron invocations use a dedicated user-agent (do not rely on this alone).
  if (process.env.VERCEL === "1") {
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua.includes("vercel-cron")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const now = new Date();

  // Build the set of target dates for all reminder windows
  const targetDates = REMINDER_WINDOWS.map(({ days, type }) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return { type, dateStr: d.toISOString().split("T")[0] };
  });

  const dateStrings = targetDates.map((t) => t.dateStr);

  // Batch-fetch all upcoming deadlines across all windows in one query
  const { data: deadlines } = await supabase
    .from("deadlines")
    .select(
      `id, name, due_date, business_id,
       businesses!inner (
         id, name, owner_id, billing_status, plan_tier
       )`
    )
    .in("due_date", dateStrings)
    .neq("status", "compliant");

  if (!deadlines?.length) {
    return NextResponse.json({ processed: 0, errors: 0, timestamp: now.toISOString() });
  }

  // Batch-fetch all already-sent reminder_log entries for these deadlines
  const deadlineIds = deadlines.map((d) => d.id);
  const { data: sentLogs } = await supabase
    .from("reminder_log")
    .select("deadline_id, reminder_type")
    .in("deadline_id", deadlineIds)
    .eq("status", "sent");

  const sentSet = new Set(
    (sentLogs ?? []).map((r) => `${r.deadline_id}:${r.reminder_type}`)
  );

  // Batch-fetch all owner emails
  const ownerIds = [...new Set(deadlines.map((d) => {
    const biz = Array.isArray(d.businesses) ? d.businesses[0] : d.businesses;
    return biz?.owner_id;
  }).filter(Boolean) as string[])];

  const emailMap = new Map<string, string>();
  await Promise.all(
    ownerIds.map(async (ownerId) => {
      const { data } = await supabase.auth.admin.getUserById(ownerId);
      if (data?.user?.email) emailMap.set(ownerId, data.user.email);
    })
  );

  let processed = 0;
  let errors = 0;

  // Build pending reminders
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
        business.plan_tier === "growth" || business.plan_tier === "scale";
      if (isPremiumReminder && !hasPremiumPlan) continue;

      if (sentSet.has(`${deadline.id}:${type}`)) continue;

      const email = emailMap.get(business.owner_id);
      if (!email) continue;

      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const trackingParams = new URLSearchParams({
          utm_source: "reminder",
          utm_medium: "email",
          utm_campaign: type,
        });
        const deadlineUrl = `${appUrl}/deadlines/${deadline.id}?${trackingParams}`;

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

  // Batch-insert all reminder log entries
  if (toInsert.length > 0) {
    await supabase.from("reminder_log").insert(toInsert);
  }

  // Snapshot compliance scores for all active businesses
  await snapshotComplianceScores(supabase);

  return NextResponse.json({ processed, errors, timestamp: now.toISOString() });
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

  // Batch fetch all deadlines for all pending businesses in one query
  const pendingIds = pending.map((b) => b.id);
  const { data: allDeadlines } = await supabase
    .from("deadlines")
    .select("business_id, status, due_date")
    .in("business_id", pendingIds);

  if (!allDeadlines?.length) return;

  // Group deadlines by business in memory
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
    // Use the same formula as the dashboard for consistency
    snapshots.push({
      business_id: biz.id,
      score: computeComplianceScore(deadlines, computeAutoStatus),
    });
  }

  if (snapshots.length > 0) {
    await supabase.from("compliance_score_history").insert(snapshots);
  }
}
