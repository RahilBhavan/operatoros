"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/doctrine/Button";

interface Prefs {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  phone_number?: string | null;
  phone_verified_at?: string | null;
  sms_severity_threshold?: string;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  tcpa_opted_in_at?: string | null;
  slack_enabled?: boolean;
  slack_webhook_url?: string | null;
  slack_severity_threshold?: string;
}

interface Props {
  initial: Prefs | null;
  smsConfigured: boolean;
}

export default function NotificationPreferencesForm({
  initial,
  smsConfigured,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    email_enabled: initial?.email_enabled ?? true,
    sms_enabled: initial?.sms_enabled ?? false,
    phone_number: initial?.phone_number ?? "",
    sms_severity_threshold: initial?.sms_severity_threshold ?? "high",
    quiet_hours_start: initial?.quiet_hours_start ?? "",
    quiet_hours_end: initial?.quiet_hours_end ?? "",
    tcpa_acknowledged: Boolean(initial?.tcpa_opted_in_at),
    slack_enabled: initial?.slack_enabled ?? false,
    slack_webhook_url: initial?.slack_webhook_url ?? "",
    slack_severity_threshold: initial?.slack_severity_threshold ?? "high",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    { kind: "ok" | "error"; message: string } | null
  >(null);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.sms_enabled && !form.tcpa_acknowledged) {
      setStatus({
        kind: "error",
        message:
          "You must acknowledge the SMS-consent notice before enabling SMS.",
      });
      return;
    }
    if (form.sms_enabled && !/^\+[1-9][0-9]{6,14}$/.test(form.phone_number)) {
      setStatus({
        kind: "error",
        message: "Phone number must be E.164 format (e.g. +15551234567).",
      });
      return;
    }
    if (
      form.slack_enabled &&
      !/^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+$/.test(
        form.slack_webhook_url
      )
    ) {
      setStatus({
        kind: "error",
        message:
          "Slack webhook URL must start with https://hooks.slack.com/services/",
      });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_enabled: form.email_enabled,
          sms_enabled: form.sms_enabled,
          phone_number: form.phone_number.trim() || null,
          sms_severity_threshold: form.sms_severity_threshold,
          quiet_hours_start: form.quiet_hours_start || null,
          quiet_hours_end: form.quiet_hours_end || null,
          tcpa_acknowledged: form.tcpa_acknowledged,
          slack_enabled: form.slack_enabled,
          slack_webhook_url: form.slack_webhook_url.trim() || null,
          slack_severity_threshold: form.slack_severity_threshold,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Failed to save.",
        });
        return;
      }
      setStatus({ kind: "ok", message: "Saved." });
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-6">
      <section className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-4 py-2">
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            Email
          </span>
        </div>
        <label className="bg-[var(--color-field)] px-4 py-2.5 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.email_enabled}
            onChange={(e) => update("email_enabled", e.target.checked)}
          />
          <span style={{ fontFamily: "var(--font-index)" }}>
            Send reminders to my account email
          </span>
        </label>
      </section>

      <section className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-4 py-2">
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            SMS
          </span>
        </div>
        <div className="bg-[var(--color-field)] px-4 py-2.5 flex flex-col gap-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.sms_enabled}
              onChange={(e) => update("sms_enabled", e.target.checked)}
              disabled={!smsConfigured}
            />
            <span style={{ fontFamily: "var(--font-index)" }}>
              Send reminders by SMS
              {!smsConfigured ? " (admin must connect Twilio first)" : ""}
            </span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="t-utility">Phone number (E.164)</span>
            <input
              type="tel"
              placeholder="+15551234567"
              value={form.phone_number}
              onChange={(e) => update("phone_number", e.target.value)}
              className="t-input"
              disabled={!form.sms_enabled}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="t-utility">Send SMS for severity ≥</span>
            <select
              value={form.sms_severity_threshold}
              onChange={(e) =>
                update("sms_severity_threshold", e.target.value)
              }
              className="t-input"
              disabled={!form.sms_enabled}
            >
              <option value="critical">Critical only</option>
              <option value="high">High and above</option>
              <option value="medium">Medium and above</option>
              <option value="low">Everything</option>
            </select>
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="t-utility">Quiet hours start</span>
              <input
                type="time"
                value={form.quiet_hours_start}
                onChange={(e) => update("quiet_hours_start", e.target.value)}
                className="t-input"
                disabled={!form.sms_enabled}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="t-utility">Quiet hours end</span>
              <input
                type="time"
                value={form.quiet_hours_end}
                onChange={(e) => update("quiet_hours_end", e.target.value)}
                className="t-input"
                disabled={!form.sms_enabled}
              />
            </label>
          </div>
          {form.sms_enabled ? (
            <label className="flex items-start gap-3 mt-2">
              <input
                type="checkbox"
                checked={form.tcpa_acknowledged}
                onChange={(e) => update("tcpa_acknowledged", e.target.checked)}
              />
              <span
                className="text-[13px]"
                style={{ fontFamily: "var(--font-index)" }}
              >
                I agree to receive automated compliance reminders by SMS from
                OperatorOS at the number above. Message frequency varies by
                my deadline volume. Msg &amp; data rates may apply. Reply
                STOP to cancel, HELP for help.
              </span>
            </label>
          ) : null}
        </div>
      </section>

      <section className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-4 py-2">
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            Slack
          </span>
        </div>
        <div className="bg-[var(--color-field)] px-4 py-2.5 flex flex-col gap-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.slack_enabled}
              onChange={(e) => update("slack_enabled", e.target.checked)}
            />
            <span style={{ fontFamily: "var(--font-index)" }}>
              Send reminders to a Slack channel
            </span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="t-utility">Slack incoming-webhook URL</span>
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/T.../B.../..."
              value={form.slack_webhook_url}
              onChange={(e) => update("slack_webhook_url", e.target.value)}
              className="t-input"
              disabled={!form.slack_enabled}
            />
            <span
              className="text-[12px] opacity-70"
              style={{ fontFamily: "var(--font-index)" }}
            >
              Create one at api.slack.com/messaging/webhooks — pick a channel,
              copy the URL. We never see your messages, only the webhook
              endpoint.
            </span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="t-utility">Send Slack for severity ≥</span>
            <select
              value={form.slack_severity_threshold}
              onChange={(e) =>
                update("slack_severity_threshold", e.target.value)
              }
              className="t-input"
              disabled={!form.slack_enabled}
            >
              <option value="critical">Critical only</option>
              <option value="high">High and above</option>
              <option value="medium">Medium and above</option>
              <option value="low">Everything</option>
            </select>
          </label>
        </div>
      </section>

      {status ? (
        <div
          className={`border-2 px-4 py-3 ${
            status.kind === "ok"
              ? "border-[var(--color-ground)]"
              : "border-[var(--color-mark)] bg-[var(--color-mark)]"
          }`}
        >
          <p
            className="text-[14px]"
            style={{
              fontFamily: "var(--font-index)",
              color:
                status.kind === "ok"
                  ? "var(--color-ground)"
                  : "var(--color-field)",
            }}
          >
            {status.message}
          </p>
        </div>
      ) : null}

      <div>
        <Button type="submit" variant="mark" disabled={saving}>
          {saving ? "Saving…" : "Save preferences →"}
        </Button>
      </div>
    </form>
  );
}
