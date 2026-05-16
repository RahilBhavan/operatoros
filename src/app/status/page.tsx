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

export const metadata: Metadata = {
  title: "Status",
  description:
    "OperatorOS system status — current state, recent incidents, and how to subscribe to updates.",
  alternates: { canonical: "/status" },
};

const COMPONENTS = [
  { label: "Web app · operatoros.com", status: "ok" as const },
  { label: "Authentication · Supabase Auth", status: "ok" as const },
  { label: "Database · Supabase Postgres", status: "ok" as const },
  { label: "Reminder cron · Vercel + Resend", status: "ok" as const },
  { label: "Stripe webhook ingest", status: "ok" as const },
  { label: "AI insights · Anthropic", status: "ok" as const },
];

export default function StatusPage() {
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
            <span className="text-[var(--color-mark)]">operational</span>.
          </Display>
          <Body className="!text-[19px] text-[var(--color-ground)] opacity-80 leading-relaxed mb-10">
            Pre-launch · this page is a transparency floor, not yet wired into
            a real-time monitoring service. We&apos;ll cut over to a third-party
            status provider (BetterStack / Statuspage) before general
            availability and replace this page with live signal.
          </Body>

          {/* Component list */}
          <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] divide-y-2 divide-[var(--color-ground)]/15 mb-12">
            {COMPONENTS.map((c) => (
              <div
                key={c.label}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <span className="text-[15px] text-[var(--color-ground)]">
                  {c.label}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="w-2.5 h-2.5 bg-[var(--color-ground)]"
                  />
                  <Utility className="!text-[12px] text-[var(--color-ground)] opacity-80">
                    Operational
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
            <Body className="text-[var(--color-ground)] opacity-85 leading-relaxed mb-5">
              Until the third-party status feed is live, we&apos;ll email
              affected customers directly. If you want to be on the proactive
              incident notification list before that infra ships, email us and
              we&apos;ll add you.
            </Body>
            <div className="inline-flex flex-wrap items-center gap-3 border-2 border-[var(--color-ground)] px-5 py-3 bg-[var(--color-field-soft)]">
              <Utility className="text-[var(--color-ground)] opacity-70">
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
