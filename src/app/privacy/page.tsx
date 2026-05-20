import type { Metadata } from "next";
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
  title: "Privacy Policy",
  description:
    "How OperatorOS collects, uses, and protects your data — including subprocessors, security, cookies, and your rights.",
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE_DATE = "May 15, 2026";

const SECTIONS: Array<{ n: string; id: string; title: string }> = [
  { n: "01", id: "collect", title: "What we collect" },
  { n: "02", id: "use", title: "How we use it" },
  { n: "03", id: "subprocessors", title: "Subprocessors we share with" },
  { n: "04", id: "rights", title: "Your rights" },
  { n: "05", id: "security", title: "Security" },
  { n: "06", id: "cookies", title: "Cookies & unsubscribe" },
  { n: "07", id: "children", title: "Children" },
  { n: "08", id: "changes", title: "Changes" },
  { n: "09", id: "contact", title: "Contact" },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-field)]">
      <MarketingNav />

      <main className="flex-1 px-6 py-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
          <article className="max-w-[760px]">
            <div className="flex items-center gap-3 mb-4">
              <Index className="!text-[15px]">PA-LEGAL</Index>
              <Utility className="">CATEGORY · PRIVACY</Utility>
            </div>
            <H1 className="mb-3">Privacy Policy.</H1>
            <Caption className="mb-2">
              Effective <Index className="!text-[13px]">{EFFECTIVE_DATE}</Index>
              {" · "}Material changes communicated by email at least 14 days in
              advance.
            </Caption>

            <div className="border-2 border-[var(--color-mark)] px-5 py-4 my-5">
              <Utility className="text-[var(--color-mark)] mb-2">
                NOTICE · DRAFT
              </Utility>
              <Body className="!text-[15px]">
                Draft pending legal review. A counsel-reviewed policy will
                replace this draft before general availability.
              </Body>
            </div>

            <details
              className="lg:hidden border-2 border-[var(--color-ground)] mb-5"
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

            <div className="flex flex-col gap-6">
              <Section n="01" id="collect" title="What we collect">
                <ul className="flex flex-col gap-2">
                  <Bullet>
                    <strong>Account info</strong> — email, password hash
                    (Supabase Auth), name and role if you provide them.
                  </Bullet>
                  <Bullet>
                    <strong>Business profile</strong> — business name,
                    industry, state, entity type, employee count, and locations
                    you enter.
                  </Bullet>
                  <Bullet>
                    <strong>Deadlines &amp; documents</strong> — items you
                    create or upload to track your compliance.
                  </Bullet>
                  <Bullet>
                    <strong>Billing</strong> — handled by Stripe. We store a
                    Stripe customer ID; we do not store card numbers.
                  </Bullet>
                  <Bullet>
                    <strong>Marketing signals</strong> — when you submit a
                    waitlist form, we record source/medium/campaign and the
                    referring URL.
                  </Bullet>
                  <Bullet>
                    <strong>Server logs</strong> — standard request logs (IP,
                    timestamp, route) for security and abuse prevention,
                    retained 30 days.
                  </Bullet>
                </ul>
              </Section>

              <Section n="02" id="use" title="How we use it">
                <Body>
                  To provide the service: populate your compliance calendar,
                  send reminders, render dashboards, process payments, and let
                  you share your compliance status with an accountant or
                  auditor you authorize. We use aggregate signals to improve
                  the product. We do not sell your data.
                </Body>
              </Section>

              <Section
                n="03"
                id="subprocessors"
                title="Subprocessors we share with"
              >
                <ul className="flex flex-col gap-2">
                  <Bullet>
                    <strong>Supabase</strong> — database, auth, storage (US
                    region).
                  </Bullet>
                  <Bullet>
                    <strong>Stripe</strong> — payment processing.
                  </Bullet>
                  <Bullet>
                    <strong>Resend</strong> — transactional email delivery.
                  </Bullet>
                  <Bullet>
                    <strong>Anthropic</strong> — AI compliance insights
                    (business profile snippets sent at request time; Anthropic
                    training disabled on our traffic).
                  </Bullet>
                  <Bullet>
                    <strong>Vercel</strong> — hosting and cron.
                  </Bullet>
                </ul>
              </Section>

              <Section n="04" id="rights" title="Your rights">
                <Body>
                  You can export your data, correct it, or delete your account
                  and all associated data at any time. Email{" "}
                  <a
                    href="mailto:privacy@operatoros.com"
                    className="t-link"
                  >
                    privacy@operatoros.com
                  </a>{" "}
                  with requests. We honor verifiable GDPR and CCPA/CPRA rights
                  regardless of jurisdiction.
                </Body>
              </Section>

              <Section n="05" id="security" title="Security">
                <Body>
                  Data is encrypted in transit (TLS) and at rest. Row-level
                  security policies enforce per-business data isolation. Our
                  engineering-facing threat model is available on request —
                  email{" "}
                  <a
                    href="mailto:security@operatoros.com"
                    className="t-link"
                  >
                    security@operatoros.com
                  </a>
                  .
                </Body>
              </Section>

              <Section n="06" id="cookies" title="Cookies & unsubscribe">
                <Body className="mb-3">
                  First-party session cookies (Supabase Auth) keep you signed
                  in. No third-party tracking cookies.
                </Body>
                <Body>
                  <strong>Unsubscribe from reminders:</strong> every reminder
                  email contains a one-click unsubscribe link tied to a
                  single-use token; visiting it disables email reminders for
                  the associated account. You can also re-enable reminders
                  from your account settings.
                </Body>
              </Section>

              <Section n="07" id="children" title="Children">
                <Body>OperatorOS is not intended for users under 18.</Body>
              </Section>

              <Section n="08" id="changes" title="Changes">
                <Body>
                  Material changes will be communicated by email at least 14
                  days in advance.
                </Body>
              </Section>

              <Section n="09" id="contact" title="Contact">
                <Body>
                  Privacy questions:{" "}
                  <a
                    href="mailto:privacy@operatoros.com"
                    className="t-link"
                  >
                    privacy@operatoros.com
                  </a>
                </Body>
              </Section>
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-8 border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-5">
              <Utility className=" mb-3 block">On this page</Utility>
              <ul className="flex flex-col gap-2.5 text-[13px]">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-[var(--color-ground)] hover:text-[var(--color-mark)]"
                    >
                      <span className=" mr-2">{s.n}</span>
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-baseline gap-3">
      <Index className="!text-[12px] shrink-0">→</Index>
      <span className="t-body">{children}</span>
    </li>
  );
}
