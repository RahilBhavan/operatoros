/**
 * WS-E — Full-funnel analytics.
 *
 * Zero-dependency PostHog client (calls /capture directly with fetch). The
 * design constraint here is that introducing a new npm dependency would be a
 * shell-level action; we get full PostHog capture semantics without one.
 *
 * No-op stub when `NEXT_PUBLIC_POSTHOG_KEY` is absent → tests stay
 * deterministic and local dev does not need a key.
 *
 * Server-side capture only for now. Page views and client-side events would
 * need posthog-js (a dep add); they are out of scope for this pass. Every
 * event below fires from a server route or server action, which is where we
 * have authoritative ids anyway.
 *
 * IMPORTANT: never send PII (email, name) as properties. Only ids, plan
 * tiers, severities, and categorical fields. Roadmap acceptance criteria.
 */

const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

function getKey(): string | null {
  return (
    process.env.POSTHOG_API_KEY ??
    process.env.NEXT_PUBLIC_POSTHOG_KEY ??
    null
  );
}

export type AnalyticsEvent =
  | "signup_started"
  | "signup_completed"
  | "oauth_used"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "deadline_marked_done"
  | "deadline_snoozed"
  | "share_link_created"
  | "share_link_viewed"
  | "reminder_sent"
  | "reminder_opened"
  | "accountant_connected"
  | "accountant_correction_submitted"
  | "upgrade_started"
  | "upgrade_completed"
  | "churn"
  | "invite_link_visited"
  | "invite_link_signup"
  | "invite_link_conversion";

export interface TrackArgs {
  distinctId: string; // user id, business id, or anonymous session id
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean | null>;
  // Optional `groups` are PostHog org/business grouping; pass { business: id }
  // to attach the event to a business cohort.
  groups?: Record<string, string>;
  timestamp?: Date;
}

/**
 * Fire-and-forget event capture. Never throws — analytics failures must not
 * affect product behavior. Returns `{ sent: boolean }` for testability.
 */
export async function track(args: TrackArgs): Promise<{ sent: boolean }> {
  const key = getKey();
  if (!key) return { sent: false };

  // Strip any property whose value is undefined or whose key contains
  // case-insensitive "email"/"name"/"phone" — defense-in-depth against PII
  // accidentally getting into payloads.
  const safeProps: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(args.properties ?? {})) {
    if (v === undefined) continue;
    if (/email|name|phone/i.test(k)) continue;
    safeProps[k] = v;
  }

  const payload = {
    api_key: key,
    event: args.event,
    distinct_id: args.distinctId,
    properties: safeProps,
    groups: args.groups,
    timestamp: (args.timestamp ?? new Date()).toISOString(),
  };

  try {
    const resp = await fetch(`${POSTHOG_HOST.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Keep connections short; the capture endpoint accepts and 200s fast.
      signal: AbortSignal.timeout(2000),
    });
    return { sent: resp.ok };
  } catch {
    return { sent: false };
  }
}

/**
 * Identify a user — attaches durable properties to all future events for
 * this distinct_id. Used post-auth to set plan_tier, role, state, and any
 * invited_by_accountant_id cohort key.
 */
export async function identify(
  distinctId: string,
  properties: Record<string, string | number | boolean | null>
): Promise<{ sent: boolean }> {
  const key = getKey();
  if (!key) return { sent: false };

  const safeProps: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v === undefined) continue;
    if (/email|name|phone/i.test(k)) continue;
    safeProps[k] = v;
  }

  const payload = {
    api_key: key,
    event: "$identify",
    distinct_id: distinctId,
    properties: { $set: safeProps },
  };

  try {
    const resp = await fetch(`${POSTHOG_HOST.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000),
    });
    return { sent: resp.ok };
  } catch {
    return { sent: false };
  }
}

export function isAnalyticsConfigured(): boolean {
  return getKey() !== null;
}
