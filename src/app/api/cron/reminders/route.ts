import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email";

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
  // Vercel Cron authentication
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  let processed = 0;
  let errors = 0;

  for (const { days, type } of REMINDER_WINDOWS) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Get deadlines due on target date that haven't been reminded yet
    const { data: deadlines } = await supabase
      .from("deadlines")
      .select(
        `
        id,
        name,
        due_date,
        business_id,
        businesses!inner (
          id,
          name,
          owner_id,
          billing_status,
          plan_tier
        )
      `
      )
      .eq("due_date", dateStr)
      .neq("status", "compliant");

    if (!deadlines?.length) continue;

    for (const deadline of deadlines) {
      const business = Array.isArray(deadline.businesses)
        ? deadline.businesses[0]
        : deadline.businesses;

      if (!business) continue;

      // Only send reminders to active/trialing accounts
      const isEligible =
        business.billing_status === "active" ||
        business.billing_status === "trialing";

      // 7-day and 1-day reminders only for growth/scale plans
      const isPremiumReminder = type === "7_day" || type === "1_day";
      const hasPremiumPlan =
        business.plan_tier === "growth" || business.plan_tier === "scale";

      if (!isEligible) continue;
      if (isPremiumReminder && !hasPremiumPlan) continue;

      // Check if this reminder was already sent
      const { data: existing } = await supabase
        .from("reminder_log")
        .select("id")
        .eq("deadline_id", deadline.id)
        .eq("reminder_type", type)
        .single();

      if (existing) continue;

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(
        business.owner_id
      );

      const email = userData?.user?.email;
      if (!email) continue;

      try {
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
          deadlineUrl: `${process.env.NEXT_PUBLIC_APP_URL}/deadlines/${deadline.id}`,
        });

        await supabase.from("reminder_log").insert({
          deadline_id: deadline.id,
          business_id: deadline.business_id,
          reminder_type: type as ReminderType,
          recipient_email: email,
        });

        processed++;
      } catch {
        errors++;
      }
    }
  }

  return NextResponse.json({ processed, errors, timestamp: now.toISOString() });
}
