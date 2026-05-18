import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
  title: "Security",
  description:
    "How OperatorOS stores, encrypts, and isolates customer data — plus the audits, threat model, and responsible disclosure path.",
  alternates: { canonical: "/security" },
};

const STORAGE_FACTS = [
  {
    label: "Hosting region",
    value: "Supabase, US-East",
    note: "Postgres + Auth + Storage. Data does not leave US infrastructure.",
  },
  {
    label: "Encryption in transit",
    value: "TLS 1.3",
    note: "HSTS enabled; HTTPS-only on every route, including marketing.",
  },
  {
    label: "Encryption at rest",
    value: "AES-256",
    note: "Provided by Supabase Postgres + Storage at the infrastructure layer.",
  },
  {
    label: "Tenant isolation",
    value: "Postgres RLS",
    note: "Every multi-tenant table carries row-level security policies keyed off the authenticated business. No service-role queries in user-facing routes.",
  },
  {
    label: "Payment data",
    value: "Stripe-vaulted",
    note: "OperatorOS stores only the Stripe customer ID. We never see, log, or persist card numbers.",
  },
  {
    label: "Session",
    value: "First-party cookies",
    note: "Supabase Auth session cookies are first-party and functional. No third-party tracking cookies.",
  },
];

const THREAT_MODEL = [
  {
    surface: "/api/waitlist",
    risk: "Spam signups, enumeration.",
    mitigation:
      "Email-shape validation, service-role isolated. Vercel WAF rate-limit rule documented as a pre-launch action.",
  },
  {
    surface: "/api/billing/webhook",
    risk: "Forged Stripe events, metadata spoofing.",
    mitigation:
      "HMAC signature verification; business resolved by `stripe_customer_id`; metadata `business_id` must match the DB row before any subscription update.",
  },
  {
    surface: "/api/cron/reminders",
    risk: "Bearer-secret leak triggering mass sends.",
    mitigation:
      "Rotatable `CRON_SECRET`; Vercel `vercel-cron` UA gate; admin client scoped to this route only; Authorization header never logged.",
  },
  {
    surface: "/api/ai/compliance-insights",
    risk: "Parallel requests exceeding LLM cost budget.",
    mitigation:
      "Atomic `try_consume_ai_rate_limit` RPC with advisory transaction lock; per-tier window cap; gated to Business plan.",
  },
  {
    surface: "/share/[token] · /accountant/[token]",
    risk: "Token guessing or unauthorized portal access.",
    mitigation:
      "128-bit random hex tokens, revocable from settings, view-counted with IP-hashed access log, 90-day expiry on accountant magic links.",
  },
  {
    surface: "Document storage",
    risk: "Cross-tenant file access (IDOR).",
    mitigation:
      "Supabase Storage RLS policies + ownership check before generating signed URLs; signed URLs are short-lived.",
  },
];

export default function SecurityPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-field)]">
      <MarketingNav />

      <main className="flex-1">
        {/* HERO */}
        <section className="px-6 py-20 sm:py-24 border-b-2 border-[var(--color-ground)]">
          <div className="max-w-3xl mx-auto">
            <Utility className="text-[var(--color-mark)] mb-4 block">
              Security
            </Utility>
            <Display
              as="h1"
              className="!text-[38px] sm:!text-[60px] !leading-[1.05] mb-5"
            >
              The honest answer to{" "}
              <span className="text-[var(--color-mark)]">
                &quot;is this safe?&quot;
              </span>
            </Display>
            <Body className="!text-[19px] text-[var(--color-ground)]  leading-relaxed">
              We&apos;re pre-revenue, so we haven&apos;t spent on a SOC 2 yet —
              but every architectural decision has been made as if we were
              about to. Here&apos;s exactly what we do today, what we
              don&apos;t, and what&apos;s coming.
            </Body>
          </div>
        </section>

        {/* STORAGE */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <H2 className="mb-3">How your data is stored.</H2>
            <Body className="text-[var(--color-ground)]  max-w-2xl mb-10">
              Six facts about where your data lives, how it&apos;s encrypted,
              and what we never touch.
            </Body>
            <div className="border-2 border-[var(--color-ground)] divide-y-2 divide-[var(--color-ground)]">
              {STORAGE_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 p-5 sm:p-6"
                >
                  <div>
                    <Utility className="text-[var(--color-ground)] ">
                      {fact.label}
                    </Utility>
                    <Index className="!text-[15px] block mt-1">
                      {fact.value}
                    </Index>
                  </div>
                  <Body className="!text-[15px] text-[var(--color-ground)]">
                    {fact.note}
                  </Body>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AUDITS */}
        <section className="px-6 py-20 bg-[var(--color-field)] border-y-2 border-[var(--color-ground)]">
          <div className="max-w-3xl mx-auto">
            <H2 className="mb-4">What audits we have today.</H2>
            <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-6 sm:p-8">
              <Index className="!text-[38px] block mb-2">None.</Index>
              <Body className="text-[var(--color-ground)] mb-4 leading-relaxed">
                That&apos;s the honest answer. SOC 2 Type II, ISO 27001, and
                HIPAA-readiness are scoped for the post-revenue roadmap —
                buying a Type I report before there&apos;s a real customer to
                attest to is theater, and we don&apos;t do theater.
              </Body>
              <Body className="text-[var(--color-ground)] leading-relaxed">
                Until then, we publish the threat model below, ship every
                multi-tenant query through RLS, and respond to security reports
                within 72 hours. The first customer who needs a Type II report
                is the trigger to start the auditor engagement.
              </Body>
            </div>
          </div>
        </section>

        {/* THREAT MODEL */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <H2 className="mb-3">Threat model — by surface.</H2>
            <Body className="text-[var(--color-ground)]  max-w-2xl mb-10">
              The full per-route version lives in our repo at{" "}
              <code className="text-[var(--color-mark)]">
                docs/security/threat-models.md
              </code>{" "}
              and is available to enterprise prospects on request. Six
              load-bearing examples here.
            </Body>
            <div className="border-2 border-[var(--color-ground)] divide-y-2 divide-[var(--color-ground)]">
              {THREAT_MODEL.map((entry) => (
                <div
                  key={entry.surface}
                  className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4"
                >
                  <div>
                    <Utility className="text-[var(--color-mark)]">
                      Surface
                    </Utility>
                    <p className="font-bold text-[var(--color-ground)] mt-1 text-[14px] break-all">
                      {entry.surface}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <Utility className="text-[var(--color-ground)] ">
                        Risk
                      </Utility>
                      <Body className="!text-[15px] mt-1">{entry.risk}</Body>
                    </div>
                    <div>
                      <Utility className="text-[var(--color-ground)] ">
                        Mitigation
                      </Utility>
                      <Body className="!text-[15px] mt-1 text-[var(--color-ground)]">
                        {entry.mitigation}
                      </Body>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DISCLOSURE */}
        <section className="px-6 py-20 bg-[var(--color-ground)] text-[var(--color-field)]">
          <div className="max-w-3xl mx-auto">
            <Utility className="text-[var(--color-mark)] mb-4 block">
              Responsible disclosure
            </Utility>
            <H2 className="!text-[var(--color-field)] mb-4">
              Found something? Tell us.
            </H2>
            <Body className="text-[var(--color-field)]  leading-relaxed mb-6">
              We acknowledge security reports within 72 hours and triage within
              5 business days. We will not pursue legal action against
              researchers who follow this policy: report privately first, give
              us a reasonable window to fix, no destructive testing on
              production data, no social engineering of our team or customers.
            </Body>
            <div className="border-2 border-[var(--color-field)] p-5 sm:p-6 inline-flex flex-wrap items-center gap-4">
              <Utility className="!text-[var(--color-field)]">
                Report to
              </Utility>
              <a
                href="mailto:security@operatoros.com"
                className="text-[var(--color-field)] hover:text-[var(--color-mark)] underline underline-offset-4 decoration-2 text-[16px] font-bold inline-flex items-center gap-2"
              >
                security@operatoros.com
                <ArrowRight aria-hidden className="w-4 h-4" />
              </a>
            </div>
            <Caption className="!text-[var(--color-field)]  mt-6">
              No bug bounty program yet — but a thank-you in the changelog and
              an enterprise demo on the house if you find something real.
            </Caption>
          </div>
        </section>

        {/* Sub-processors — required by WS-2.2 BAA scaffolds. Every vendor
            that may touch customer data is listed here with their role and
            BAA status (where HIPAA applies). */}
        <section id="sub-processors" className="px-6 py-16 sm:py-20 border-b-2 border-[var(--color-ground)]">
          <div className="max-w-[1080px] mx-auto">
            <Utility className="mb-3">Sub-processors</Utility>
            <H2 className="mb-6">Who else touches your data</H2>
            <Body className="mb-8 max-w-[680px]">
              The third-party services we use to operate OperatorOS. Where
              applicable for healthcare customers, each is required to sign a
              Business Associate Agreement (HIPAA &sect;164.504(e)).
            </Body>
            <div className="border-2 border-[var(--color-ground)] overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-ground)] text-[var(--color-field)]">
                    <th className="t-utility px-4 py-3">Vendor</th>
                    <th className="t-utility px-4 py-3">Role</th>
                    <th className="t-utility px-4 py-3">Data class</th>
                    <th className="t-utility px-4 py-3">BAA</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      v: "Supabase",
                      role: "Postgres + Auth + Storage",
                      data: "All customer data",
                      baa: "Required for healthcare customers — Supabase Pro/Team plan supports BAA. Status: PENDING.",
                    },
                    {
                      v: "Resend",
                      role: "Transactional email",
                      data: "Recipient email + reminder body",
                      baa: "Required for PHI-bearing reminders. Status: PENDING.",
                    },
                    {
                      v: "Anthropic",
                      role: "AI compliance insights (Claude Haiku)",
                      data: "Business profile + tracked deadline names",
                      baa: "Available via Claude on Bedrock or direct agreement. Status: PENDING.",
                    },
                    {
                      v: "Twilio",
                      role: "SMS reminders (optional)",
                      data: "Recipient phone + reminder body",
                      baa: "Required if SMS enabled for PHI-bearing customer. Status: PENDING.",
                    },
                    {
                      v: "Stripe",
                      role: "Subscription billing",
                      data: "Customer name, email, payment method",
                      baa: "Stripe does not consider billing metadata PHI. Status: N/A.",
                    },
                    {
                      v: "Vercel",
                      role: "Hosting + edge functions",
                      data: "Request transit (TLS-terminated; no app-layer persistence)",
                      baa: "Vercel Enterprise BAA available. Status: PENDING.",
                    },
                  ].map((r, i) => (
                    <tr
                      key={r.v}
                      className={
                        i === 5 ? "" : "border-b border-[var(--color-ground)]"
                      }
                    >
                      <td
                        className="px-4 py-3 text-[14px] font-bold"
                        style={{ fontFamily: "var(--font-index)" }}
                      >
                        {r.v}
                      </td>
                      <td
                        className="px-4 py-3 text-[14px]"
                        style={{ fontFamily: "var(--font-index)" }}
                      >
                        {r.role}
                      </td>
                      <td
                        className="px-4 py-3 text-[14px]"
                        style={{ fontFamily: "var(--font-index)" }}
                      >
                        {r.data}
                      </td>
                      <td
                        className="px-4 py-3 text-[13px]"
                        style={{ fontFamily: "var(--font-index)" }}
                      >
                        {r.baa}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Caption className="mt-4 max-w-[680px]">
              &ldquo;Status: PENDING&rdquo; means the BAA is required before
              healthcare customers can ingest PHI through OperatorOS and is
              actively being negotiated. Healthcare-vertical onboarding is
              gated on full coverage of every PENDING row above.
            </Caption>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
