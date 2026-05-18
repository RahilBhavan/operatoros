import type { Metadata } from "next";
import {
  Display,
  H2,
  Body,
  Caption,
  Utility,
  Index,
} from "@/components/doctrine/Typography";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Status",
  description:
    "OperatorOS system status — current state, recent incidents, and how to subscribe to updates.",
  alternates: { canonical: "/status" },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CheckState = "ok" | "degraded" | "down" | "skipped";

type CheckResult = {
  label: string;
  state: CheckState;
  detail?: string;
};

/** Race a thenable against a hard timeout; resolves to `degraded` on timeout. */
async function withTimeout<T>(
  p: PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T | { __timeout: true; label: string }> {
  return await Promise.race<T | { __timeout: true; label: string }>([
    Promise.resolve(p),
    new Promise((resolve) =>
      setTimeout(() => resolve({ __timeout: true, label }), ms),
    ),
  ]);
}

/** Narrow a withTimeout result to the timeout sentinel. */
function isTimeout<T>(
  v: T | { __timeout: true; label: string },
): v is { __timeout: true; label: string } {
  return typeof v === "object" && v !== null && "__timeout" in v;
}

async function checkSupabase(): Promise<CheckResult> {
  const label = "Database · Supabase Postgres";
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { label, state: "skipped", detail: "Not configured" };
  }
  try {
    const supabase = createAdminClient();
    const result = await withTimeout(
      supabase.from("businesses").select("id").limit(1),
      3000,
      label,
    );
    if (isTimeout(result)) {
      return { label, state: "degraded", detail: "Timeout after 3s" };
    }
    if (result.error) {
      return { label, state: "down", detail: result.error.message };
    }
    return { label, state: "ok" };
  } catch (err) {
    return {
      label,
      state: "down",
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkStripe(): Promise<CheckResult> {
  const label = "Stripe webhook ingest";
  if (!process.env.STRIPE_SECRET_KEY) {
    return { label, state: "skipped", detail: "Not configured" };
  }
  try {
    // Dynamic import — avoid loading stripe when key isn't set (avoids cold-start cost on /status).
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();
    // `balance.retrieve()` is zero-arg and hits the account associated with
    // the secret key. Cheaper than `accounts.retrieve(id)` (no id to pass).
    const result = await withTimeout(stripe.balance.retrieve(), 3000, label);
    if (isTimeout(result)) {
      return { label, state: "degraded", detail: "Timeout after 3s" };
    }
    return { label, state: "ok" };
  } catch (err) {
    return {
      label,
      state: "down",
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function checkResend(): CheckResult {
  const label = "Reminder cron · Vercel + Resend";
  if (!process.env.RESEND_API_KEY) {
    return { label, state: "skipped", detail: "Not configured" };
  }
  // No cheap ping for Resend; presence of the key is the only safe signal.
  return { label, state: "ok", detail: "Key present (no live ping)" };
}

function checkAnthropic(): CheckResult {
  const label = "AI insights · Anthropic";
  if (!process.env.ANTHROPIC_API_KEY) {
    return { label, state: "skipped", detail: "Not configured" };
  }
  // No cheap ping for Anthropic.
  return { label, state: "ok", detail: "Key present (no live ping)" };
}

function checkAuth(supabaseState: CheckState): CheckResult {
  // Supabase Auth lives in the same project as the DB — if the DB ping
  // succeeded the auth API is almost certainly up.
  return {
    label: "Authentication · Supabase Auth",
    state: supabaseState === "ok" ? "ok" : supabaseState,
    detail:
      supabaseState === "ok"
        ? undefined
        : "Derived from database health",
  };
}

function checkWebApp(): CheckResult {
  // If this server component rendered, the web app is up by definition.
  return { label: "Web app · operatoros.com", state: "ok" };
}

const STATE_COPY: Record<CheckState, string> = {
  ok: "Operational",
  degraded: "Degraded",
  down: "Outage",
  skipped: "Not configured",
};

function dotColor(state: CheckState) {
  switch (state) {
    case "down":
      return "var(--color-mark)";
    case "degraded":
      return "var(--color-mark)";
    case "skipped":
      return "var(--color-ground)";
    default:
      return "var(--color-ground)";
  }
}

export default async function StatusPage() {
  // Run live checks in parallel.
  const [supabase, stripe] = await Promise.all([
    checkSupabase(),
    checkStripe(),
  ]);
  const resend = checkResend();
  const anthropic = checkAnthropic();
  const auth = checkAuth(supabase.state);
  const web = checkWebApp();

  const checks: CheckResult[] = [web, auth, supabase, resend, stripe, anthropic];
  const anyDown = checks.some((c) => c.state === "down");
  const anyDegraded = checks.some((c) => c.state === "degraded");
  const headlineState: CheckState = anyDown
    ? "down"
    : anyDegraded
      ? "degraded"
      : "ok";

  const headlineWord =
    headlineState === "ok"
      ? "operational"
      : headlineState === "degraded"
        ? "degraded"
        : "down";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-field)]">
      <MarketingNav />

      <main className="flex-1 px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <Utility className="text-[var(--color-mark)] mb-4 block">
            Status
          </Utility>
          <Display
            as="h1"
            className="!text-[38px] sm:!text-[60px] !leading-[1.05] mb-5"
          >
            All systems{" "}
            <span className="text-[var(--color-mark)]">{headlineWord}</span>.
          </Display>
          <Body className="!text-[19px] text-[var(--color-ground)]  leading-relaxed mb-10">
            Live signal — checks run on every page load with a 3-second timeout
            per dependency. We&apos;ll cut over to a third-party status provider
            (BetterStack / Statuspage) before general availability and replace
            this page with continuous monitoring.
          </Body>

          {/* Component list */}
          <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] divide-y-2 divide-[var(--color-ground)] mb-12">
            {checks.map((c) => (
              <div
                key={c.label}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex flex-col">
                  <span className="text-[15px] text-[var(--color-ground)]">
                    {c.label}
                  </span>
                  {c.detail ? (
                    <Caption className="!text-[12px] mt-1">{c.detail}</Caption>
                  ) : null}
                </div>
                <span className="inline-flex items-center gap-2 shrink-0">
                  <span
                    aria-hidden
                    className="w-2.5 h-2.5"
                    style={{ background: dotColor(c.state) }}
                  />
                  <Utility className="!text-[12px] text-[var(--color-ground)] ">
                    {STATE_COPY[c.state]}
                  </Utility>
                </span>
              </div>
            ))}
          </div>

          {/* Incidents */}
          <H2 className="mb-3">Recent incidents.</H2>
          <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-6">
            <Index className="!text-[38px] block mb-2">None.</Index>
            <Body className="text-[var(--color-ground)] leading-relaxed">
              No incidents to report. Pre-launch traffic is light and we
              haven&apos;t yet had a degradation worth recording. When we do,
              this section will list date, scope, duration, root cause, and
              remediation.
            </Body>
          </div>

          {/* Subscribe */}
          <section className="mt-14 border-t-2 border-[var(--color-ground)] pt-10">
            <H2 className="mb-3">Get notified of incidents.</H2>
            <Body className="text-[var(--color-ground)]  leading-relaxed mb-5">
              Until the third-party status feed is live, we&apos;ll email
              affected customers directly. If you want to be on the proactive
              incident notification list before that infra ships, email us and
              we&apos;ll add you.
            </Body>
            <div className="inline-flex flex-wrap items-center gap-3 border-2 border-[var(--color-ground)] px-5 py-3 bg-[var(--color-field)]">
              <Utility className="text-[var(--color-ground)] ">
                Subscribe
              </Utility>
              <a
                href="mailto:status@operatoros.com?subject=Status%20notifications"
                className="t-link text-[var(--color-ground)] font-bold"
              >
                status@operatoros.com
              </a>
            </div>
            <Caption className="!mt-6">
              Security-relevant incidents follow the responsible-disclosure
              process on the{" "}
              <a href="/security" className="t-link">
                security page
              </a>
              .
            </Caption>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
