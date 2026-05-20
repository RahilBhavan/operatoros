import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbError } from "@/lib/api/respond";
import { isSlackWebhookUrl } from "@/lib/slack";

export const runtime = "nodejs";

const VALID_SEVERITY = new Set(["critical", "high", "medium", "low", "info"]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const phone =
    typeof body.phone_number === "string" && body.phone_number.length > 0
      ? body.phone_number
      : null;
  if (phone && !/^\+[1-9][0-9]{6,14}$/.test(phone)) {
    return NextResponse.json(
      { error: "Phone must be E.164 format" },
      { status: 400 }
    );
  }

  const smsEnabled = Boolean(body.sms_enabled);
  const tcpaAck = Boolean(body.tcpa_acknowledged);
  if (smsEnabled && !tcpaAck) {
    return NextResponse.json(
      { error: "TCPA acknowledgement required to enable SMS" },
      { status: 400 }
    );
  }
  if (smsEnabled && !phone) {
    return NextResponse.json(
      { error: "Phone number required to enable SMS" },
      { status: 400 }
    );
  }

  const severity =
    typeof body.sms_severity_threshold === "string" &&
    VALID_SEVERITY.has(body.sms_severity_threshold)
      ? (body.sms_severity_threshold as
          | "critical"
          | "high"
          | "medium"
          | "low"
          | "info")
      : "high";

  const fwd = req.headers.get("x-forwarded-for");
  const ip =
    fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;

  // WS-G.Slack — webhook-URL flow. If enabling Slack the URL must be a
  // canonical hooks.slack.com URL; we reject anything else server-side
  // even though the DB CHECK is the second line of defense.
  const slackEnabled = Boolean(body.slack_enabled);
  const slackWebhookRaw =
    typeof body.slack_webhook_url === "string" && body.slack_webhook_url.length > 0
      ? body.slack_webhook_url
      : null;
  if (slackEnabled && !slackWebhookRaw) {
    return NextResponse.json(
      { error: "Slack webhook URL required to enable Slack" },
      { status: 400 }
    );
  }
  if (slackWebhookRaw && !isSlackWebhookUrl(slackWebhookRaw)) {
    return NextResponse.json(
      { error: "Slack webhook URL must start with https://hooks.slack.com/services/" },
      { status: 400 }
    );
  }
  const slackSeverity =
    typeof body.slack_severity_threshold === "string" &&
    VALID_SEVERITY.has(body.slack_severity_threshold)
      ? (body.slack_severity_threshold as
          | "critical"
          | "high"
          | "medium"
          | "low"
          | "info")
      : "high";

  const upsertRow = {
    user_id: user.id,
    email_enabled: Boolean(body.email_enabled ?? true),
    sms_enabled: smsEnabled,
    phone_number: phone,
    sms_severity_threshold: severity,
    quiet_hours_start:
      typeof body.quiet_hours_start === "string" && body.quiet_hours_start.length > 0
        ? body.quiet_hours_start
        : null,
    quiet_hours_end:
      typeof body.quiet_hours_end === "string" && body.quiet_hours_end.length > 0
        ? body.quiet_hours_end
        : null,
    tcpa_opted_in_at: smsEnabled ? new Date().toISOString() : null,
    tcpa_opt_in_ip: smsEnabled ? ip : null,
    // WS-G.Slack columns — supabase types haven't been regenerated, but
    // the keys are accepted by the upsert; cast at write time.
    slack_enabled: slackEnabled,
    slack_webhook_url: slackWebhookRaw,
    slack_severity_threshold: slackSeverity,
    slack_connected_at: slackEnabled ? new Date().toISOString() : null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("notification_preferences") as any)
    .upsert(upsertRow, { onConflict: "user_id" });

  if (error) {
    return dbError("notifications/preferences/POST", error);
  }
  return NextResponse.json({ ok: true });
}
