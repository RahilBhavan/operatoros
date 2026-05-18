/**
 * WS-1.1 — Minimal Twilio HTTP wrapper. Calls the REST API with fetch (no
 * SDK dependency). Gated on TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN +
 * TWILIO_FROM_NUMBER env vars; if any is missing, sends are skipped (the
 * caller checks `isSmsConfigured()` first).
 *
 * Hard stop for the user: provision a Twilio account, set a budget cap,
 * and add the three env vars. After that, SMS reminders flow alongside
 * email through the existing cron path with no further code changes.
 *
 * Compliance:
 *   • TCPA opt-in must be recorded in notification_preferences before any
 *     SMS is sent — the caller enforces this (see send-reminder).
 *   • STOP / HELP keyword handling is delegated to Twilio's default
 *     handlers; enable "Advanced Opt-Out" in the Twilio console.
 *   • Every send is logged to sms_log with cost + delivery status.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface SmsParams {
  toPhone: string;
  body: string;
  userId?: string | null;
  businessId?: string | null;
  kind: "reminder" | "verification" | "system";
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

export interface SmsResult {
  ok: boolean;
  smsLogId?: string;
  error?: string;
}

export async function sendSms(params: SmsParams): Promise<SmsResult> {
  if (!isSmsConfigured()) {
    return { ok: false, error: "SMS not configured (TWILIO_* env vars missing)" };
  }

  const admin = createAdminClient();

  // Insert sms_log row first as 'queued' so failures are observable.
  const { data: logRow, error: logErr } = await admin
    .from("sms_log")
    .insert({
      to_phone: params.toPhone,
      body: params.body.slice(0, 1600),
      kind: params.kind,
      user_id: params.userId ?? null,
      business_id: params.businessId ?? null,
      status: "queued",
    })
    .select("id")
    .single();

  if (logErr || !logRow) {
    return { ok: false, error: logErr?.message ?? "Failed to log SMS" };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const form = new URLSearchParams();
  form.set("To", params.toPhone);
  form.set("From", from);
  form.set("Body", params.body);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    type TwilioResp = {
      sid?: string;
      status?: string;
      error_message?: string;
      error_code?: number | string;
      price?: string;
    };
    const data = (await resp.json()) as TwilioResp;

    if (!resp.ok) {
      await admin
        .from("sms_log")
        .update({
          status: "failed",
          error_code:
            data.error_code != null ? String(data.error_code) : null,
          provider_message_id: data.sid ?? null,
        })
        .eq("id", logRow.id);
      return {
        ok: false,
        smsLogId: logRow.id,
        error: data.error_message ?? "Twilio send failed",
      };
    }

    // Twilio price is a negative dollar string (e.g. "-0.0075"). Convert
    // to positive cents.
    let costCents: number | null = null;
    if (typeof data.price === "string") {
      const n = Math.abs(parseFloat(data.price));
      if (Number.isFinite(n)) costCents = Math.round(n * 100);
    }

    await admin
      .from("sms_log")
      .update({
        status: "sent",
        provider_message_id: data.sid ?? null,
        cost_cents: costCents,
      })
      .eq("id", logRow.id);

    return { ok: true, smsLogId: logRow.id };
  } catch (err) {
    await admin
      .from("sms_log")
      .update({
        status: "failed",
        error_code: "network_error",
      })
      .eq("id", logRow.id);
    return {
      ok: false,
      smsLogId: logRow.id,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
