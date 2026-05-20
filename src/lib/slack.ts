// WS-G.Slack — Send a Slack reminder via an incoming-webhook URL the user
// pasted into /settings/notifications. v1 uses the webhook-URL flow (no
// Slack app needed by us); a later OAuth upgrade can swap in a bot token
// without touching call sites — the function signature stays the same.
//
// Each send writes a slack_log row keyed by the SHA-256 of the webhook URL,
// so we can debug delivery without persisting the secret URL itself.

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const SLACK_WEBHOOK_RE = /^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+$/;

export function isSlackWebhookUrl(value: unknown): value is string {
  return typeof value === "string" && SLACK_WEBHOOK_RE.test(value);
}

export interface SlackParams {
  webhookUrl: string;
  text: string;
  blocks?: ReadonlyArray<Record<string, unknown>>;
  userId?: string | null;
  businessId?: string | null;
  kind: "reminder" | "system";
}

export interface SlackResult {
  ok: boolean;
  logId?: string;
  error?: string;
}

function hashWebhook(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

export async function sendSlack(params: SlackParams): Promise<SlackResult> {
  if (!isSlackWebhookUrl(params.webhookUrl)) {
    return { ok: false, error: "Invalid Slack webhook URL" };
  }

  const admin = createAdminClient();
  const webhookHash = hashWebhook(params.webhookUrl);

  // Cast: slack_log is in 20260518000017 but supabase types haven't been
  // regenerated. Structurally safe per the migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slackLogTable = admin.from("slack_log" as never) as any;

  const { data: logRow, error: logErr } = await slackLogTable
    .insert({
      user_id: params.userId ?? null,
      business_id: params.businessId ?? null,
      webhook_url_hash: webhookHash,
      body: params.text.slice(0, 4000),
      kind: params.kind,
      status: "queued",
    })
    .select("id")
    .single();

  if (logErr || !logRow) {
    return {
      ok: false,
      error: (logErr as { message?: string } | null)?.message ?? "Failed to log Slack",
    };
  }
  const logId = (logRow as { id: string }).id;

  try {
    const resp = await fetch(params.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: params.text,
        ...(params.blocks ? { blocks: params.blocks } : {}),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      await slackLogTable
        .update({
          status: "failed",
          http_status: resp.status,
          error_code: errText.slice(0, 200) || `http_${resp.status}`,
        })
        .eq("id", logId);
      return { ok: false, logId, error: `Slack returned ${resp.status}` };
    }

    await slackLogTable
      .update({ status: "sent", http_status: resp.status })
      .eq("id", logId);
    return { ok: true, logId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await slackLogTable
      .update({ status: "failed", error_code: message.slice(0, 200) })
      .eq("id", logId);
    return { ok: false, logId, error: message };
  }
}
