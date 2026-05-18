import Link from "next/link";
import { LinkButton } from "@/components/doctrine/Button";
import { StampChip } from "@/components/doctrine/StampChip";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { SupabaseSetupBanner } from "@/components/marketing/SupabaseSetupBanner";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { PenaltyCalc } from "@/components/marketing/PenaltyCalc";
import { PortfolioPreview } from "@/components/marketing/PortfolioPreview";
import { PanAmTag } from "@/components/doctrine/PanAmTag";

const PRICING_TIERS = [
  {
    name: "Lite",
    code: "L-039",
    price: 39,
    description:
      "For thin-compliance solo operators — calendar + email reminders only.",
    features: [
      "Unlimited deadlines",
      "1 GB document storage",
      "Email reminders",
      "Federal + state taxonomy",
      "No AI insights",
      "No share link · no accountant portal",
    ],
    highlighted: false,
    cta: "Notify me",
    href: "/?lite-waitlist",
    comingSoon: true,
  },
  {
    name: "Business",
    code: "B-079",
    price: 79,
    description: "For small businesses tracking their own compliance.",
    features: [
      "Unlimited deadlines",
      "10 GB document storage",
      "Email + SMS reminders",
      "AI compliance insights",
      "Shareable audit link",
      "PDF audit export",
      "Invite your accountant · read-only",
      "Up to 5 team members",
    ],
    highlighted: true,
    cta: "Start free trial",
    href: "/sign-up",
    comingSoon: false,
  },
  {
    name: "Accountant",
    code: "A-299",
    price: 299,
    description: "For CPAs and bookkeepers managing client portfolios.",
    features: [
      "Up to 200 client portfolios",
      "Bulk client onboarding",
      "White-labelled audit reports",
      "Per-client score dashboard",
      "Notes + flags portal",
      "Priority API access",
      "Dedicated account manager",
    ],
    highlighted: false,
    cta: "Start as an accountant",
    href: "/sign-up?role=accountant",
    comingSoon: false,
  },
] as const;

const PAIN_STATS = [
  {
    code: "P-01",
    stat: "$2,000",
    label:
      "An IRS Form 941 deposit missed by 16+ days incurs a 10% failure-to-deposit penalty. On a $20k quarterly deposit, that's $2,000 — and the next missed deposit stacks.",
    source: "IRC §6656 · IRS Notice 746",
  },
  {
    code: "P-02",
    stat: "47",
    label:
      "Median annual compliance obligations OperatorOS pre-populates for a 25-employee, multi-state business.",
    source: "Federal taxonomy + 5 states deep · 46 template-fallback",
  },
  {
    code: "P-03",
    stat: "1 miss",
    label:
      "is enough to trigger penalties that exceed an annual subscription. The maths only works one way.",
    source: null,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Answer five questions",
    description:
      "Industry · state · entity · employee count · contractors. We pre-populate every federal and state deadline that applies — instantly.",
  },
  {
    step: "02",
    title: "Review your risk-weighted calendar",
    description:
      "Each deadline ships with severity, statute citation, agency URL, and dollar exposure. A missed $200k OSHA report doesn't count the same as a missed sign permit.",
  },
  {
    step: "03",
    title: "Never get blindsided",
    description:
      "Reminders at 120, 90, 60, 30, 14, 7, 1 days out. Documents stored, versioned, audit-ready behind a revocable share link with view tracking.",
  },
];

const DEADLINE_CATEGORIES = [
  { code: "LIC", title: "Business licence renewals", desc: "City · county · state" },
  { code: "CRT", title: "Employee certifications", desc: "OSHA · food handler · CDL" },
  { code: "INS", title: "COI · insurance renewals", desc: "GL · WC · auto · cyber" },
  { code: "ENT", title: "Entity filings", desc: "Annual reports · registered agent" },
  { code: "INSP", title: "Equipment inspections", desc: "Fire · health · OSHA logs" },
  { code: "TAX", title: "Tax deadlines", desc: "Sales · payroll · estimates" },
  { code: "PER", title: "Other permits & filings", desc: "EPA · DOT · state boards" },
];

const COMPARISON_ROWS: Array<{
  capability: string;
  spreadsheet: string;
  avalara: string;
  operatoros: string;
}> = [
  {
    capability: "Cross-vertical coverage · tax + licence + OSHA + industry",
    spreadsheet: "Manual",
    avalara: "Sales-tax only",
    operatoros: "Out of the box",
  },
  {
    capability: "Statute citations on every deadline",
    spreadsheet: "No",
    avalara: "Partial",
    operatoros: "Every row",
  },
  {
    capability: "Risk-weighted compliance score",
    spreadsheet: "No",
    avalara: "No",
    operatoros: "Yes",
  },
  {
    capability: "Accountant portfolio view",
    spreadsheet: "No",
    avalara: "No",
    operatoros: "Yes",
  },
  {
    capability: "Dollar exposure per missed deadline",
    spreadsheet: "No",
    avalara: "No",
    operatoros: "Yes",
  },
  {
    capability: "Sub-$100/mo entry tier",
    spreadsheet: "Yes",
    avalara: "No",
    operatoros: "$79",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is this legal or tax advice?",
    a: "No. OperatorOS is a compliance-tracking tool. We pre-populate deadlines that typically apply, send reminders, and store evidence — but you remain responsible for confirming what applies and filing on time. Always verify with a licensed professional.",
  },
  {
    q: "How do you know what applies to my state?",
    a: "On signup you give us four inputs — industry (NAICS slug), state, entity type, employee count. Federal deadlines are deep across every taxonomy. Five states (CA, TX, NY, DE, FL) have hand-curated state-specific rule sets; the remaining 46 ride a template-fallback rule set that covers the most common annual filings but does not yet name every county- or industry-specific obligation. Every deadline carries its statute citation and the responsible agency's URL so you (or your accountant) can verify in seconds. We're working state-by-state — request priority curation for yours from the homepage form.",
  },
  {
    q: "What happens after the 14-day free trial?",
    a: "Your plan begins billing monthly via Stripe at the advertised rate — $79 Business / $299 Accountant. Cancel anytime through the billing portal; cancellations take effect at the end of the current period.",
  },
  {
    q: "Can my accountant access without paying?",
    a: "Yes. On any Business plan you can invite an accountant via a magic link — read-only by default. If your accountant manages multiple clients, the Accountant plan ($299/mo) gives them a portfolio dashboard across every client they're connected to.",
  },
  {
    q: "How is this different from a spreadsheet or Avalara?",
    a: "Spreadsheets assume you already know what to track — which is the actual problem. Avalara is sales-tax-focused enterprise pricing. OperatorOS auto-populates cross-vertical deadlines (licences, OSHA, certifications, entity filings, tax) at sub-$100/mo entry, with an accountant portfolio view neither has shipped.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-[var(--color-field)] text-[var(--color-ground)] flex flex-col min-h-screen">
      <SupabaseSetupBanner />
      <MarketingNav />

      {/* HERO */}
      <section className="px-6 pt-12 pb-20 sm:pt-20 sm:pb-24 border-b-2 border-[var(--color-ground)]">
        <div className="max-w-[1160px] mx-auto grid md:grid-cols-[1.4fr_1fr] gap-10 md:gap-16 items-start">
          <div className="order-2 md:order-1">
            <div className="flex flex-wrap gap-2 mb-8">
              <StampChip tone="mark" dot>Phase 01 · Chicago</StampChip>
              <StampChip tone="field">14-day trial · no card</StampChip>
            </div>

            <h1
              className="mb-6"
              style={{
                fontFamily: "var(--font-destination)",
                fontWeight: 900,
                fontSize: "clamp(44px, 7vw, 84px)",
                lineHeight: 0.96,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                color: "var(--color-ground)",
              }}
            >
              Never get blindsided<br />by a{" "}
              <span style={{ color: "var(--color-mark)" }}>compliance</span>{" "}
              failure again.
            </h1>

            <p
              className="mb-10 max-w-[560px]"
              style={{
                fontFamily: "var(--font-index)",
                fontWeight: 400,
                fontSize: 19,
                lineHeight: 1.45,
                color: "var(--color-ground)",
              }}
            >
              A federal compliance calendar with statute citations,
              severity-tiered risk scoring, and a portfolio view your accountant
              can actually use. Five states (CA · TX · NY · DE · FL) ship with
              hand-curated state rule sets today; the rest are on a template
              fallback with deep curation rolling out. Pre-populated in 30
              seconds; audit-ready behind a share link your auditor can verify
              with one click.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <LinkButton href="/sign-up" variant="mark" size="lg">
                Start free trial →
              </LinkButton>
              <LinkButton href="/sign-up?role=accountant" variant="ghost" size="lg">
                I&apos;m an accountant
              </LinkButton>
            </div>

            <div className="t-utility text-[var(--color-ground)] mt-6">
              14-day free trial · no credit card ·{" "}
              <a href="#waitlist" className="t-link">
                join waitlist
              </a>{" "}
              if outside the US
            </div>
          </div>

          <div className="order-1 md:order-2 flex justify-center md:justify-center items-start pt-2 md:pt-4">
            <div className="hidden md:block">
              <PanAmTag
                serial="004221"
                destination="IRS"
                city="SEP · 30 · 2026"
                agency="irs"
                routing="D"
                routingMark
                formRun={{ a: "B-3,", b: "941", c: "—Q3" }}
                stripLeft="3077-9412 / FINAL DEADLINE"
                stripRight="PTD. BY OPS / 5-77/D"
                scale={1}
                shadow
              />
            </div>
            <div className="md:hidden">
              <PanAmTag
                serial="004221"
                destination="IRS"
                city="SEP · 30 · 2026"
                agency="irs"
                routing="D"
                routingMark
                formRun={{ a: "B-3,", b: "941", c: "—Q3" }}
                stripLeft="3077-9412 / FINAL DEADLINE"
                stripRight="PTD. BY OPS / 5-77/D"
                scale={0.78}
                shadow
              />
            </div>
          </div>
        </div>
      </section>

      {/* PAIN STATS — inverse ink panel */}
      <section className="panel-ink px-6 py-20">
        <div className="max-w-[1160px] mx-auto">
          <div className="t-utility text-[var(--color-field)] mb-3">
            The maths
          </div>
          <h2
            className="mb-12 max-w-[860px]"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: "clamp(32px, 4vw, 48px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "var(--color-field)",
            }}
          >
            Compliance penalties stack<br />faster than most owners realise.
          </h2>
          <div className="grid md:grid-cols-3 gap-0 border-t-2 border-[var(--color-field)]">
            {PAIN_STATS.map(({ code, stat, label, source }, i) => (
              <div
                key={code}
                className={`p-6 pt-8 flex flex-col gap-4 ${
                  i < 2 ? "md:border-r border-[var(--color-field)]" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="t-utility"
                    style={{ color: "var(--color-field)" }}
                  >
                    {code}
                  </span>
                  <StampChip tone="mark">Penalty</StampChip>
                </div>
                <div
                  className="font-black leading-none"
                  style={{
                    fontFamily: "var(--font-destination)",
                    fontWeight: 900,
                    fontSize: 64,
                    letterSpacing: "-0.02em",
                    color: "var(--color-mark)",
                  }}
                >
                  {stat}
                </div>
                <p
                  className="text-[15px] leading-relaxed flex-1"
                  style={{
                    fontFamily: "var(--font-index)",
                    color: "var(--color-field)",
                  }}
                >
                  {label}
                </p>
                {source ? (
                  <div className="t-utility text-[var(--color-field)] !text-[10px]">
                    {source}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="px-6 py-20 sm:py-24 border-b-2 border-[var(--color-ground)]"
      >
        <div className="max-w-[1160px] mx-auto">
          <div className="t-utility mb-3">The route</div>
          <h2
            className="mb-12 max-w-[760px]"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: "clamp(32px, 4vw, 48px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "var(--color-ground)",
            }}
          >
            From zero to audit-ready<br />in under thirty minutes.
          </h2>
          <div className="grid md:grid-cols-3 gap-0 border-t-2 border-[var(--color-ground)]">
            {HOW_IT_WORKS.map(({ step, title, description }, i) => (
              <div
                key={step}
                className={`pt-6 pb-2 md:px-6 ${
                  i < 2 ? "md:border-r border-[var(--color-ground)]" : ""
                } ${i === 0 ? "md:pl-0" : ""}`}
              >
                <div
                  className="font-black leading-none mb-4"
                  style={{
                    fontFamily: "var(--font-destination)",
                    fontWeight: 900,
                    fontSize: 56,
                    color: "var(--color-mark)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {step}
                </div>
                <div className="rule-stamp mb-5" />
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: "var(--font-destination)",
                    fontWeight: 700,
                    fontSize: 22,
                    lineHeight: 1.15,
                    textTransform: "uppercase",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {title}
                </h3>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{ fontFamily: "var(--font-index)" }}
                >
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOAT */}
      <section className="px-6 py-20 border-b-2 border-[var(--color-ground)]">
        <div className="max-w-[1160px] mx-auto">
          <div className="t-utility mb-3">The moat</div>
          <h2
            className="mb-3 max-w-[780px]"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: "clamp(28px, 3.5vw, 40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
            }}
          >
            Not another spreadsheet.<br />
            A jurisdiction-aware rule engine.
          </h2>
          <p
            className="mb-10 max-w-[640px]"
            style={{
              fontFamily: "var(--font-index)",
              fontSize: 17,
              lineHeight: 1.5,
            }}
          >
            Most &quot;compliance&quot; tools assume you already know what you
            owe. That&apos;s the actual problem. Here&apos;s the work we&apos;ve
            done so you don&apos;t have to.
          </p>
          <div className="grid md:grid-cols-3 gap-0 border-t-2 border-[var(--color-ground)]">
            {[
              {
                code: "M-01",
                hero: "5 states deep · 46 fallback",
                kicker: "CA · TX · NY · DE · FL deeply curated",
                body: "Federal cadences ship deep across every taxonomy. Five states have hand-curated rule sets with named agencies + statute citations. The remaining 46 ride a template-fallback set we're upgrading state-by-state — request priority curation for yours.",
              },
              {
                code: "M-02",
                hero: "Statute-cited",
                kicker: "Every penalty is sourced",
                body: "Every deadline carries its statute citation — IRC §6656, 21 USC §822, CA Rev & Tax §17941, 29 CFR 1904. Your accountant can verify in seconds.",
              },
              {
                code: "M-03",
                hero: "Risk-weighted",
                kicker: "Score, not a vibe",
                body: "A missed Form 941 deposit hurts your score more than a missed sign permit. The dashboard surfaces the top 3 actions to recover your score and the dollar exposure on the table.",
              },
            ].map((card, i) => (
              <div
                key={card.code}
                className={`pt-6 pb-4 md:px-6 ${
                  i < 2 ? "md:border-r border-[var(--color-ground)]" : ""
                } ${i === 0 ? "md:pl-0" : ""}`}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span className="t-utility">{card.code}</span>
                  <StampChip tone="field">Moat</StampChip>
                </div>
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: "var(--font-destination)",
                    fontWeight: 800,
                    fontSize: 26,
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                    textTransform: "uppercase",
                    color: "var(--color-ground)",
                  }}
                >
                  {card.hero}
                </h3>
                <div className="t-utility text-[var(--color-mark)] mb-4 !text-[11px]">
                  {card.kicker}
                </div>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{ fontFamily: "var(--font-index)" }}
                >
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="px-6 py-20 border-b-2 border-[var(--color-ground)]">
        <div className="max-w-[1160px] mx-auto">
          <div className="t-utility mb-3">Side by side</div>
          <h2
            className="mb-10"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: "clamp(28px, 3.5vw, 40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
            }}
          >
            How it compares.
          </h2>

          <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--color-ground)] text-[var(--color-field)]">
                  <th className="t-utility px-4 py-3 w-[40%]">Capability</th>
                  <th className="t-utility px-4 py-3">Spreadsheet</th>
                  <th className="t-utility px-4 py-3">Avalara-class</th>
                  <th className="t-utility px-4 py-3">OperatorOS</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.capability}
                    className={
                      i === COMPARISON_ROWS.length - 1
                        ? ""
                        : "border-b border-[var(--color-ground)]"
                    }
                  >
                    <td
                      className="px-4 py-4 text-[14px]"
                      style={{ fontFamily: "var(--font-index)", fontWeight: 600 }}
                    >
                      {row.capability}
                    </td>
                    <td
                      className="px-4 py-4 text-[14px]"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {row.spreadsheet}
                    </td>
                    <td
                      className="px-4 py-4 text-[14px]"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {row.avalara}
                    </td>
                    <td
                      className="px-4 py-4 text-[14px] font-bold"
                      style={{
                        fontFamily: "var(--font-index)",
                        color: "var(--color-mark)",
                      }}
                    >
                      {row.operatoros}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="t-utility mt-4 max-w-[760px]">
            &quot;Avalara-class&quot; refers to the category of single-vertical
            sales-tax / licence-filing compliance tools. No competitor logos or
            claims about specific products beyond their public positioning.
          </div>
        </div>
      </section>

      {/* PENALTY CALC */}
      <section className="px-6 py-20 border-b-2 border-[var(--color-ground)]">
        <div className="max-w-[820px] mx-auto">
          <div className="t-utility mb-3">Run the numbers</div>
          <h2
            className="mb-3"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: "clamp(28px, 3.5vw, 40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
            }}
          >
            What does one missed deposit actually cost?
          </h2>
          <p
            className="mb-10"
            style={{
              fontFamily: "var(--font-index)",
              fontSize: 17,
              lineHeight: 1.5,
            }}
          >
            Plug your numbers in. The maths is unkind.
          </p>
          <PenaltyCalc />
        </div>
      </section>

      {/* DEADLINE CATEGORIES — inverse ink panel */}
      <section className="panel-ink px-6 py-20">
        <div className="max-w-[1160px] mx-auto">
          <div className="t-utility text-[var(--color-field)] mb-3">
            Taxonomy
          </div>
          <h2
            className="mb-3 max-w-[780px]"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: "clamp(28px, 3.5vw, 40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
              color: "var(--color-field)",
            }}
          >
            We track what your<br />calendar forgets.
          </h2>
          <p
            className="mb-10 max-w-[640px]"
            style={{
              fontFamily: "var(--font-index)",
              fontSize: 17,
              lineHeight: 1.5,
              color: "var(--color-field)",
            }}
          >
            The seven deadline categories that quietly drive most small-business
            compliance failures.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-t border-[var(--color-field)]">
            {DEADLINE_CATEGORIES.map(({ code, title, desc }, i) => (
              <div
                key={code}
                className={`p-5 border-b border-[var(--color-field)] ${
                  i % 4 === 3
                    ? ""
                    : "lg:border-r border-[var(--color-field)] md:border-r"
                }`}
              >
                <div
                  className="t-utility mb-3"
                  style={{ color: "var(--color-mark)" }}
                >
                  {code}
                </div>
                <div
                  className="mb-2"
                  style={{
                    fontFamily: "var(--font-index)",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--color-field)",
                    lineHeight: 1.25,
                  }}
                >
                  {title}
                </div>
                <div
                  className="t-utility"
                  style={{
                    color: "var(--color-field)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {desc}
                </div>
              </div>
            ))}
          </div>
          <div className="t-utility text-[var(--color-field)] mt-6">
            OperatorOS deadline taxonomy · not a market-share claim
          </div>
        </div>
      </section>

      {/* ACCOUNTANT */}
      <section
        id="accountants"
        className="px-6 py-20 sm:py-24 border-b-2 border-[var(--color-ground)]"
      >
        <div className="max-w-[1160px] mx-auto grid md:grid-cols-[1.1fr_1fr] gap-12 items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <StampChip tone="mark">A-200</StampChip>
              <span className="t-utility text-[var(--color-mark)]">
                For accountants
              </span>
            </div>
            <h2
              className="mb-5"
              style={{
                fontFamily: "var(--font-destination)",
                fontWeight: 800,
                fontSize: "clamp(28px, 3.5vw, 40px)",
                lineHeight: 1.1,
                letterSpacing: "-0.015em",
                textTransform: "uppercase",
              }}
            >
              Manage your entire<br />client book from one dashboard.
            </h2>
            <p
              className="mb-6 leading-relaxed"
              style={{
                fontFamily: "var(--font-index)",
                fontSize: 17,
                lineHeight: 1.5,
              }}
            >
              If you&apos;re a CPA or bookkeeper running 40–200 small-business
              clients, the Accountant plan gives you per-client compliance
              scores, bulk onboarding, white-labelled audit reports, and an
              action portal where the notes you leave show up on your
              client&apos;s dashboard.
            </p>
            <ul className="flex flex-col gap-3 mb-8 border-t border-[var(--color-ground)] pt-4">
              {[
                "Onboard up to 200 client portfolios",
                "White-labelled compliance reports",
                "Per-client compliance score dashboard",
                "Bulk reminders + portfolio-wide notes",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-baseline gap-3 border-b border-[var(--color-ground)] pb-3"
                >
                  <span
                    className="font-bold"
                    style={{
                      fontFamily: "var(--font-destination)",
                      color: "var(--color-mark)",
                      fontSize: 14,
                      letterSpacing: "0.04em",
                    }}
                  >
                    →
                  </span>
                  <span
                    className="text-[15px]"
                    style={{ fontFamily: "var(--font-index)" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <LinkButton href="/sign-up?role=accountant" variant="ground" size="lg">
              Start as an accountant →
            </LinkButton>
          </div>
          <PortfolioPreview />
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-20 sm:py-24 border-b-2 border-[var(--color-ground)]">
        <div className="max-w-[920px] mx-auto">
          <div className="t-utility mb-3">Manifest · pricing</div>
          <h2
            className="mb-3"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: "clamp(28px, 3.5vw, 40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
            }}
          >
            Three tiers · pick your shape.
          </h2>
          <p
            className="mb-12 max-w-[560px]"
            style={{
              fontFamily: "var(--font-index)",
              fontSize: 17,
              lineHeight: 1.5,
            }}
          >
            Lite for thin-compliance solos · Business for owner-operators ·
            Accountant for portfolio practices. Business and Accountant come
            with a 14-day free trial; Lite is in waitlist.
          </p>

          <div className="grid md:grid-cols-3 gap-0 border-2 border-[var(--color-ground)]">
            {PRICING_TIERS.map((tier, i) => {
              const inverse = tier.highlighted;
              return (
                <div
                  key={tier.name}
                  className={`p-8 flex flex-col gap-6 ${
                    inverse
                      ? "panel-ink"
                      : "bg-[var(--color-field)] text-[var(--color-ground)]"
                  } ${i < PRICING_TIERS.length - 1 ? "md:border-r-2 border-[var(--color-ground)]" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div
                        className="t-utility mb-2"
                        style={{
                          color: inverse
                            ? "var(--color-field)"
                            : "var(--color-ground)",
                        }}
                      >
                        {tier.name}
                      </div>
                      <div
                        className="text-[15px] max-w-[260px]"
                        style={{
                          fontFamily: "var(--font-index)",
                          color: inverse
                            ? "var(--color-field)"
                            : "var(--color-ground)",
                        }}
                      >
                        {tier.description}
                      </div>
                    </div>
                    <StampChip tone={inverse ? "mark" : "ground"}>
                      {tier.code}
                    </StampChip>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-black leading-none"
                      style={{
                        fontFamily: "var(--font-destination)",
                        fontWeight: 900,
                        fontSize: 80,
                        letterSpacing: "-0.025em",
                        color: inverse
                          ? "var(--color-field)"
                          : "var(--color-ground)",
                      }}
                    >
                      ${tier.price}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-index)",
                        fontWeight: 500,
                        fontSize: 18,
                        color: inverse
                          ? "var(--color-field)"
                          : "var(--color-ground)",
                      }}
                    >
                      / mo
                    </span>
                  </div>

                  <ul className="flex flex-col gap-0 border-t border-current">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-baseline gap-3 py-3 border-b border-current"
                      >
                        <span
                          className="font-bold"
                          style={{
                            fontFamily: "var(--font-destination)",
                            color: inverse
                              ? "var(--color-mark)"
                              : "var(--color-mark)",
                            fontSize: 14,
                          }}
                        >
                          →
                        </span>
                        <span
                          className="text-[15px]"
                          style={{
                            fontFamily: "var(--font-index)",
                            color: inverse
                              ? "var(--color-field)"
                              : "var(--color-ground)",
                          }}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.comingSoon ? "#waitlist" : tier.href}
                    className={inverse ? "btn btn-inverse mt-auto" : "btn mt-auto"}
                  >
                    {tier.comingSoon ? `${tier.cta} · coming soon →` : `${tier.cta} →`}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 border-b-2 border-[var(--color-ground)]">
        <div className="max-w-[820px] mx-auto">
          <div className="t-utility mb-3">FAQ</div>
          <h2
            className="mb-3"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: "clamp(28px, 3.5vw, 40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
            }}
          >
            Frequently asked.
          </h2>
          <p
            className="mb-10"
            style={{
              fontFamily: "var(--font-index)",
              fontSize: 17,
              lineHeight: 1.5,
            }}
          >
            The questions every prospect emails us during their trial.
          </p>
          <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)]">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={item.q}
                className={`group p-5 sm:p-6 ${
                  i === FAQ_ITEMS.length - 1
                    ? ""
                    : "border-b border-[var(--color-ground)]"
                }`}
                open={i === 0}
              >
                <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                  <span
                    className="font-bold text-[var(--color-ground)] flex-1"
                    style={{
                      fontFamily: "var(--font-index)",
                      fontSize: 17,
                      lineHeight: 1.35,
                    }}
                  >
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="text-[var(--color-mark)] font-black text-2xl leading-none mt-1 transition-transform group-open:rotate-45 select-none"
                    style={{ fontFamily: "var(--font-destination)" }}
                  >
                    +
                  </span>
                </summary>
                <p
                  className="mt-4 text-[var(--color-ground)] leading-relaxed"
                  style={{
                    fontFamily: "var(--font-index)",
                    fontSize: 15,
                  }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="px-6 py-20">
        <div className="max-w-[820px] mx-auto">
          <div className="t-utility mb-3">Waitlist</div>
          <h2
            className="mb-3"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: "clamp(28px, 3.5vw, 40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
            }}
          >
            Not ready? Join the cohort waitlist.
          </h2>
          <p
            className="mb-10 max-w-[640px]"
            style={{
              fontFamily: "var(--font-index)",
              fontSize: 17,
              lineHeight: 1.5,
            }}
          >
            We onboard cohorts state-by-state. Tell us where you operate and
            we&apos;ll move you up the queue when your jurisdiction goes live.
            Outside the US? Drop your email and we&apos;ll notify you when we
            expand.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
