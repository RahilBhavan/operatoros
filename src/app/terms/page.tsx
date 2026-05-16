import type { Metadata } from "next";
import Link from "next/link";
import {
  H1,
  H3,
  Body,
  Caption,
  Utility,
  Index,
} from "@/components/doctrine";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "OperatorOS terms of service — what you can expect from the product, how billing works, and how disputes are resolved.",
  alternates: { canonical: "/terms" },
};

const EFFECTIVE_DATE = "May 15, 2026";

const SECTIONS: Array<{ n: string; id: string; title: string }> = [
  { n: "01", id: "acceptance", title: "Acceptance" },
  { n: "02", id: "what-this-is", title: "What OperatorOS is — and isn't" },
  { n: "03", id: "account", title: "Your account" },
  { n: "04", id: "billing", title: "Subscription and billing" },
  { n: "05", id: "acceptable-use", title: "Acceptable use" },
  { n: "06", id: "your-data", title: "Your data" },
  { n: "07", id: "disclaimers", title: "Disclaimers and liability" },
  { n: "08", id: "changes", title: "Changes to these terms" },
  { n: "09", id: "law", title: "Governing law" },
  { n: "10", id: "contact", title: "Contact" },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-field)]">
      <MarketingNav />

      <main className="flex-1 px-6 py-16">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
          <article className="max-w-[760px]">
            <div className="flex items-center gap-3 mb-4">
              <Index className="!text-[15px]">PA-LEGAL</Index>
              <Utility className="opacity-60">CATEGORY · TERMS</Utility>
            </div>
            <H1 className="mb-3">Terms of Service.</H1>
            <Caption className="mb-2">
              Effective <Index className="!text-[13px]">{EFFECTIVE_DATE}</Index>
              {" · "}Material changes communicated by email at least 14 days in
              advance.
            </Caption>

            <div className="border-2 border-[var(--color-mark)] px-5 py-4 my-8">
              <Utility className="text-[var(--color-mark)] mb-2">
                NOTICE · DRAFT
              </Utility>
              <Body className="!text-[15px]">
                Draft pending legal review. Provided in good faith for early
                customers; will be replaced before general availability. Email{" "}
                <a href="mailto:legal@operatoros.com" className="t-link">
                  legal@operatoros.com
                </a>{" "}
                with questions.
              </Body>
            </div>

            <details
              className="lg:hidden border-2 border-[var(--color-ground)] mb-8"
              open
            >
              <summary className="cursor-pointer list-none px-4 py-3 bg-[var(--color-ground)] text-[var(--color-field)] flex justify-between items-center">
                <Utility className="!text-[var(--color-field)]">
                  On this page
                </Utility>
                <span aria-hidden className="text-xl leading-none">
                  ▾
                </span>
              </summary>
              <ul className="px-4 py-3 flex flex-col gap-2">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-[14px] text-[var(--color-ground)] hover:text-[var(--color-mark)]"
                    >
                      {s.n} · {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            <div className="flex flex-col gap-10">
              <Section n="01" id="acceptance" title="Acceptance">
                <Body>
                  By creating an account, using the OperatorOS service, or
                  accessing any part of our platform, you agree to be bound by
                  these Terms of Service. If using the service on behalf of an
                  organization, you represent you have authority to bind that
                  organization to these terms.
                </Body>
              </Section>

              <Section
                n="02"
                id="what-this-is"
                title="What OperatorOS is — and isn't"
              >
                <Body className="mb-3">
                  OperatorOS is a compliance-tracking tool. We pre-populate
                  regulatory deadlines that typically apply to a small business
                  based on industry, state, entity type, and employee count. We
                  send reminders, store documents you upload, and compute a
                  compliance score from your deadline status.
                </Body>
                <div className="border-l-4 border-[var(--color-mark)] pl-4">
                  <Body className="font-bold">
                    OperatorOS is not legal, tax, accounting, or compliance
                    advice. We are not a law firm and we are not your
                    accountant. You remain responsible for confirming which
                    obligations apply to your business and filing them on time.
                    Always verify with a licensed professional.
                  </Body>
                </div>
              </Section>

              <Section n="03" id="account" title="Your account">
                <Body>
                  Provide accurate information when you sign up. Keep your
                  password secure and take responsibility for activity under
                  your account. Notify us immediately if you suspect
                  unauthorized access.
                </Body>
              </Section>

              <Section n="04" id="billing" title="Subscription and billing">
                <Body className="mb-3">
                  Paid plans begin with a 14-day free trial. After the trial,
                  the plan you selected is billed monthly via Stripe at the
                  advertised rate. You can cancel anytime through the billing
                  portal; cancellations take effect at the end of the current
                  billing period and there are no refunds for partial periods
                  unless required by law.
                </Body>
                <Body>
                  We may change pricing with 30 days&apos; notice. If you do
                  not agree to the new pricing, you can cancel before it takes
                  effect.
                </Body>
              </Section>

              <Section n="05" id="acceptable-use" title="Acceptable use">
                <Body>
                  Do not upload illegal content, attempt to break the service,
                  scrape it at scale, resell it without an authorized reseller
                  agreement, or use it to harm others. We may suspend or
                  terminate accounts that violate these rules.
                </Body>
              </Section>

              <Section n="06" id="your-data" title="Your data">
                <Body>
                  You own the data you put into OperatorOS. You grant us a
                  limited license to process it solely to provide the service.
                  See the{" "}
                  <Link href="/privacy" className="t-link">
                    Privacy Policy
                  </Link>{" "}
                  for how data is handled. You may export your data and delete
                  your account at any time.
                </Body>
              </Section>

              <Section
                n="07"
                id="disclaimers"
                title="Disclaimers and liability"
              >
                <Body className="mb-3">
                  The service is provided &ldquo;as is&rdquo; without warranties
                  of any kind. We do not guarantee that the deadline coverage
                  is complete for every jurisdiction, industry, or situation.
                  You are responsible for confirming what applies to you.
                </Body>
                <Body>
                  To the maximum extent permitted by law, OperatorOS&apos;s
                  aggregate liability for any claim is limited to the amount
                  you paid us in the 12 months preceding the claim.
                </Body>
              </Section>

              <Section n="08" id="changes" title="Changes to these terms">
                <Body>
                  We may update these terms from time to time. Material changes
                  will be communicated by email at least 14 days in advance.
                  Continued use after the effective date constitutes acceptance.
                </Body>
              </Section>

              <Section n="09" id="law" title="Governing law">
                <Body>
                  These terms are governed by the laws of the State of
                  Delaware, United States, without regard to its conflict of
                  laws principles. Disputes will be resolved exclusively in
                  state or federal courts located in Delaware.
                </Body>
              </Section>

              <Section n="10" id="contact" title="Contact">
                <Body>
                  Questions about these terms?{" "}
                  <a
                    href="mailto:legal@operatoros.com"
                    className="t-link"
                  >
                    legal@operatoros.com
                  </a>
                </Body>
              </Section>
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-8 border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-5">
              <Utility className="opacity-70 mb-3 block">On this page</Utility>
              <ul className="flex flex-col gap-2.5 text-[13px]">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-[var(--color-ground)] hover:text-[var(--color-mark)]"
                    >
                      <span className="opacity-50 mr-2">{s.n}</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

function Section({
  n,
  id,
  title,
  children,
}: {
  n: string;
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="border-t border-[var(--color-ground)] pt-6 scroll-mt-24"
    >
      <div className="flex items-baseline gap-4 mb-4">
        <Index className="!text-[19px]">{n}</Index>
        <H3>{title}</H3>
      </div>
      {children}
    </section>
  );
}
