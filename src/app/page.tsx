import Link from "next/link";
import { LinkButton } from "@/components/doctrine/Button";
import {
  Display,
  H2,
  H3,
  Body,
  Caption,
  Utility,
  Index,
} from "@/components/doctrine/Typography";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { PenaltyCalc } from "@/components/marketing/PenaltyCalc";
import { PortfolioPreview } from "@/components/marketing/PortfolioPreview";
import { PanAmTag } from "@/components/doctrine/PanAmTag";

const PRICING_TIERS = [
  {
    name: "Business",
    code: "B-079",
    sort: "A",
    price: 79,
    description: "For small businesses tracking their own compliance",
    features: [
      "Unlimited deadlines",
      "10 GB document storage",
      "Email + SMS reminders",
      "AI compliance insights",
      "Shareable audit link",
      "PDF audit export",
      "Invite your accountant (read-only)",
      "Up to 5 team members",
    ],
    highlighted: true,
    cta: "Start free trial",
    href: "/sign-up",
  },
  {
    name: "Accountant",
    code: "A-299",
    sort: "B",
    price: 299,
    description: "For CPAs and bookkeepers managing client portfolios",
    features: [
      "Manage up to 200 client portfolios",
      "Bulk client onboarding",
      "White-labeled compliance reports",
      "Per-client compliance score dashboard",
      "Accountant action portal (notes, flags)",
      "Priority API access",
      "Dedicated account manager",
    ],
    highlighted: false,
    cta: "Start as an accountant",
    href: "/sign-up?role=accountant",
  },
] as const;

const PAIN_STATS = [
  {
    code: "P-1",
    sort: "X",
    stat: "Penalties compound",
    label:
      "An IRS Form 941 deposit missed by 16+ days incurs a 10% failure-to-deposit penalty, plus interest, plus the original tax. For a $20k quarterly deposit, the penalty alone is $2,000 — and the next missed deposit stacks.",
    source:
      "IRC §6656 (failure-to-deposit) · IRS Notice 746 penalty rate schedule",
  },
  {
    code: "P-2",
    sort: "A",
    stat: "47",
    label:
      "Median annual compliance obligations OperatorOS pre-populates for a 25-employee, multi-state business.",
    source:
      "OperatorOS internal estimate (federal + 50-state deadline taxonomy with statute citations)",
  },
  {
    code: "P-3",
    sort: "B",
    stat: "1 missed deadline",
    label: "is enough to trigger penalties that exceed an annual subscription.",
    source: null,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    sort: "A",
    title: "Answer 5 questions",
    description:
      "Tell us your industry, state, employee count, and entity type. We pre-populate the federal and state deadlines that typically apply to your business — instantly.",
  },
  {
    step: "02",
    sort: "B",
    title: "Review your risk-weighted calendar",
    description:
      "Each deadline ships with severity, statute citation, agency source URL, and an estimated penalty if missed. Your compliance score is risk-weighted: a missed $200,000 OSHA report doesn't count the same as a missed county sign permit.",
  },
  {
    step: "03",
    sort: "C",
    title: "Never miss a deadline again",
    description:
      "Reminders at 90, 60, 30, 7, and 1 days out — subject line leads with the dollar exposure when known. Documents stored, versioned, and audit-ready behind a revocable share link with view tracking.",
  },
];

const DEADLINE_CATEGORIES = [
  { code: "LIC", title: "Business License Renewals", desc: "City, county, and state licenses" },
  { code: "CRT", title: "Employee Certifications", desc: "OSHA, food handler, CDL, safety certs" },
  { code: "INS", title: "COI / Insurance Renewals", desc: "Certificates of insurance for GC work" },
  { code: "ENT", title: "Entity Filings", desc: "Annual state reports, registered agent" },
  { code: "INSP", title: "Equipment Inspections", desc: "Fire safety, health dept, OSHA logs" },
  { code: "TAX", title: "Tax Deadlines", desc: "Sales tax, payroll tax, quarterly estimates" },
  { code: "PER", title: "Other Permits & Filings", desc: "EPA, DOT, state board renewals" },
];

const COMPARISON_ROWS: Array<{
  capability: string;
  spreadsheet: string;
  avalara: string;
  operatoros: string;
}> = [
  {
    capability: "Cross-vertical coverage (tax + license + OSHA + industry)",
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
    capability: "Dollar-exposure per missed deadline",
    spreadsheet: "No",
    avalara: "No",
    operatoros: "Yes",
  },
  {
    capability: "Sub-$100/mo entry tier",
    spreadsheet: "Yes",
    avalara: "No",
    operatoros: "Yes ($79)",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is this legal or tax advice?",
    a: "No. OperatorOS is a compliance-tracking tool. We pre-populate deadlines that typically apply, send reminders, and store evidence — but you remain responsible for confirming what applies and filing on time. Always verify with a licensed professional.",
  },
  {
    q: "How do you know what applies to my state?",
    a: "On signup you give us four inputs — industry (NAICS slug), state, entity type, employee count. We seed deadlines from a federal + 50-state taxonomy keyed off those inputs. Every deadline carries its statute citation and the responsible agency's URL so you (or your accountant) can verify in seconds.",
  },
  {
    q: "What happens after the 14-day free trial?",
    a: "Your plan begins billing monthly via Stripe at the advertised rate ($79 Business / $299 Accountant). Cancel anytime through the billing portal; cancellations take effect at the end of the current period.",
  },
  {
    q: "Can my accountant access without paying?",
    a: "Yes. On any Business plan you can invite an accountant via a magic link — read-only by default. If your accountant manages multiple clients, the Accountant plan ($299/mo) gives them a portfolio dashboard across every client they're connected to.",
  },
  {
    q: "How is this different from a spreadsheet or Avalara?",
    a: "Spreadsheets assume you already know what to track — which is the actual problem. Avalara is sales-tax-focused enterprise pricing. OperatorOS auto-populates cross-vertical deadlines (licenses, OSHA, certifications, entity filings, tax) at sub-$100/mo entry, with an accountant portfolio view neither has shipped.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-[var(--color-field)] text-[var(--color-ground)]">
      <MarketingNav />

      {/* HERO — copy left, the artifact right. Destination over decoration. */}
      <section className="px-6 py-20 sm:py-24">
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-[1.4fr_1fr] gap-12 md:gap-16 items-start">
          <div>
            <div className="inline-flex items-center gap-2 border-2 border-[var(--color-ground)] px-4 py-1.5 mb-8">
              <span
                aria-hidden
                className="w-2 h-2 bg-[var(--color-mark)] motion-safe:animate-pulse"
              />
              <Utility>
                Now in early access · 14-day free trial · no credit card
              </Utility>
            </div>

            <Display
              as="h1"
              className="!text-[48px] sm:!text-[68px] !leading-[1.0] !tracking-tight mb-6"
            >
              Never get blindsided by a{" "}
              <span className="text-[var(--color-mark)]">
                compliance failure
              </span>{" "}
              again.
            </Display>

            <Body className="t-subhead !font-normal text-[var(--color-ground)] opacity-80 mb-10 max-w-xl">
              A 50-state compliance calendar with statute citations,
              severity-tiered risk scoring, and a portfolio view your accountant
              can actually use. Pre-populated in 30 seconds; audit-ready behind a
              share link your auditor can verify with one click.
            </Body>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <LinkButton href="/sign-up" variant="mark">
                Start free trial →
              </LinkButton>
              <LinkButton href="/sign-up?role=accountant" variant="ghost">
                I&apos;m an accountant
              </LinkButton>
            </div>

            <Caption className="!mt-5">
              14-day free trial · no credit card · or{" "}
              <a href="#waitlist" className="t-link">
                join the waitlist
              </a>{" "}
              if you&apos;re outside the US.
            </Caption>
          </div>

          {/* Hero artifact — the deadline tag. The destination is the loudest mark. */}
          <div className="hidden md:flex justify-center items-start pt-2">
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
        </div>
      </section>

      {/* PAIN STATS */}
      <section className="px-6 py-20 bg-[var(--color-field-soft)] border-y-2 border-[var(--color-ground)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <H2 className="mb-3">
              Compliance penalties stack faster than most owners realize.
            </H2>
            <Body className="text-[var(--color-ground)] opacity-75 max-w-2xl mx-auto">
              One missed quarterly form. One expired license. One overlooked
              renewal. The cost of staying compliant is dwarfed by the cost of
              getting it wrong.
            </Body>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PAIN_STATS.map(({ code, sort, stat, label, source }) => (
              <div
                key={code}
                className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <Index>{code}</Index>
                  <span className="inline-flex items-center justify-center border-2 border-[var(--color-ground)] w-8 h-8 t-h3 leading-none">
                    {sort}
                  </span>
                </div>
                <H3 className="text-[var(--color-mark)] mt-1">{stat}</H3>
                <Body className="text-[var(--color-ground)] leading-relaxed flex-1">
                  {label}
                </Body>
                {source && (
                  <Utility className="text-[var(--color-ground)] opacity-50 !text-[12px]">
                    {source}
                  </Utility>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <H2 className="mb-3">
              From zero to audit-ready in under 30 minutes.
            </H2>
            <Body className="text-[var(--color-ground)] opacity-75">
              No manual research. No spreadsheets. No forgotten deadlines.
            </Body>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(({ step, sort, title, description }) => (
              <div key={step} className="flex flex-col items-start gap-4">
                <div className="flex items-baseline gap-3 border-b-2 border-[var(--color-ground)] pb-3 w-full">
                  <Index className="t-h1 !text-[var(--color-mark)] !leading-none">
                    {step}
                  </Index>
                  <span className="inline-flex items-stretch border-2 border-[var(--color-ground)]">
                    <span className="px-2 py-1 border-r-2 border-[var(--color-ground)] t-utility !text-[12px]">
                      SORT
                    </span>
                    <span className="px-2 py-1 t-h3 leading-none">{sort}</span>
                  </span>
                </div>
                <Utility className="opacity-60">STEP {step}</Utility>
                <H3>{title}</H3>
                <Body className="text-[var(--color-ground)] leading-relaxed">
                  {description}
                </Body>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOAT */}
      <section className="px-6 py-20 border-y-2 border-[var(--color-ground)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <H2 className="mb-3">
              Not another spreadsheet. A jurisdiction-aware rule engine.
            </H2>
            <Body className="text-[var(--color-ground)] opacity-75 max-w-2xl mx-auto">
              Most &quot;compliance&quot; tools assume you already know what
              you owe. That&apos;s the actual problem. Here&apos;s the work
              we&apos;ve done so you don&apos;t have to.
            </Body>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                code: "M-1",
                hero: "50 states + DC",
                kicker: "covered out of the box",
                body: "Annual report cadences, franchise tax windows, and entity filings encoded for every US state with the responsible agency named and linked.",
              },
              {
                code: "M-2",
                hero: "Statute-cited",
                kicker: "every penalty is sourced",
                body: "Every deadline carries its statute citation (IRC §6656, 21 USC §822, CA Rev & Tax §17941, 29 CFR 1904 …). Your accountant can verify in seconds.",
              },
              {
                code: "M-3",
                hero: "Risk-weighted",
                kicker: "score, not a vibe",
                body: "A missed Form 941 deposit hurts your score more than a missed sign permit. The dashboard surfaces the top 3 actions to recover your score and the dollar exposure on the table.",
              },
            ].map((card) => (
              <div
                key={card.code}
                className="border-2 border-[var(--color-ground)] p-6 bg-[var(--color-field)]"
              >
                <Index className="mb-3">{card.code}</Index>
                <H3 className="!leading-tight">{card.hero}</H3>
                <Caption className="!mt-1 mb-3">{card.kicker}</Caption>
                <Body className="text-[var(--color-ground)] leading-relaxed">
                  {card.body}
                </Body>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON STRIP */}
      <section className="px-6 py-20 bg-[var(--color-field-soft)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <H2 className="mb-3">How it compares.</H2>
            <Body className="text-[var(--color-ground)] opacity-75 max-w-2xl mx-auto">
              Text-only because we don&apos;t need a chart to make the point.
            </Body>
          </div>

          <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-ground)] text-[var(--color-field)]">
                  <th className="t-utility px-4 py-3 w-2/5">Capability</th>
                  <th className="t-utility px-4 py-3">Spreadsheet</th>
                  <th className="t-utility px-4 py-3">Avalara-class</th>
                  <th className="t-utility px-4 py-3 text-[var(--color-field)]">
                    OperatorOS
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.capability}
                    className={
                      i % 2 === 0
                        ? "bg-[var(--color-field)]"
                        : "bg-[var(--color-field-soft)]"
                    }
                  >
                    <td className="px-4 py-4 t-caption !opacity-100 text-[var(--color-ground)] border-t border-[var(--color-ground)]/15">
                      {row.capability}
                    </td>
                    <td className="px-4 py-4 t-caption text-[var(--color-ground)]/70 border-t border-[var(--color-ground)]/15">
                      {row.spreadsheet}
                    </td>
                    <td className="px-4 py-4 t-caption text-[var(--color-ground)]/70 border-t border-[var(--color-ground)]/15">
                      {row.avalara}
                    </td>
                    <td className="px-4 py-4 t-caption text-[var(--color-mark)] font-bold border-t border-[var(--color-ground)]/15">
                      {row.operatoros}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Caption className="!mt-4 !opacity-60 text-center max-w-3xl mx-auto">
            &quot;Avalara-class&quot; refers to the category of single-vertical
            (sales-tax / license-filing) compliance tools. No competitor logos
            or claims about specific products beyond their public positioning.
          </Caption>
        </div>
      </section>

      {/* PENALTY CALC */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <H2 className="mb-3">
              What does one missed deposit actually cost?
            </H2>
            <Body className="text-[var(--color-ground)] opacity-75">
              Plug your numbers in. The math is unkind.
            </Body>
          </div>
          <PenaltyCalc />
        </div>
      </section>

      {/* DEADLINE CATEGORIES */}
      <section className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <H2 className="!text-[var(--color-field)] mb-4">
            We track what your calendar forgets.
          </H2>
          <Body className="text-[var(--color-field)] opacity-80 mb-12 max-w-2xl mx-auto">
            The seven deadline categories that quietly drive most small
            business compliance failures.
          </Body>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {DEADLINE_CATEGORIES.map(({ code, title, desc }) => (
              <div
                key={code}
                className="border-2 border-[var(--color-field)]/30 p-5 flex flex-col gap-2"
              >
                <Index className="!text-[var(--color-mark)]">{code}</Index>
                <Body className="font-bold !text-[var(--color-field)]">{title}</Body>
                <Caption className="!text-[var(--color-field)] !opacity-70">
                  {desc}
                </Caption>
              </div>
            ))}
          </div>
          <Utility className="!text-[var(--color-field)] opacity-50 mt-8 inline-block">
            OperatorOS deadline taxonomy — not a market-share claim
          </Utility>
        </div>
      </section>

      {/* ACCOUNTANT SECTION */}
      <section
        id="accountants"
        className="px-6 py-20 sm:py-24 bg-[var(--color-field-soft)]"
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-3 mb-4">
              <Index className="!text-[var(--color-mark)]">A-200</Index>
              <Utility className="text-[var(--color-mark)]">
                For accountants
              </Utility>
            </div>
            <H2 className="mb-4">
              Manage your entire client book from one dashboard.
            </H2>
            <Body className="text-[var(--color-ground)] mb-6 leading-relaxed">
              If you&apos;re a CPA or bookkeeper managing 40–200 small business
              clients, the Accountant plan gives you per-client compliance
              scores, bulk client onboarding, white-labeled audit reports, and
              an action portal where you can leave notes that show up on your
              client&apos;s dashboard.
            </Body>
            <ul className="flex flex-col gap-2.5 mb-8">
              {[
                "Onboard up to 200 client portfolios",
                "White-labeled compliance reports",
                "Per-client compliance score dashboard",
                "Bulk reminders and notes",
              ].map((item) => (
                <li key={item} className="flex items-baseline gap-3">
                  <Index className="shrink-0">→</Index>
                  <Body className="text-[var(--color-ground)]">{item}</Body>
                </li>
              ))}
            </ul>
            <LinkButton href="/sign-up?role=accountant" variant="ground">
              Start as an accountant →
            </LinkButton>
          </div>
          <PortfolioPreview />
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <H2 className="mb-3">Simple, two-tier pricing.</H2>
            <Body className="text-[var(--color-ground)] opacity-75 max-w-xl mx-auto">
              One plan for the business owner. One plan for the accountant who
              serves them. Both come with a 14-day free trial.
            </Body>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`p-8 flex flex-col gap-5 border-2 border-[var(--color-ground)] relative ${
                  tier.highlighted
                    ? "bg-[var(--color-ground)] text-[var(--color-field)]"
                    : "bg-[var(--color-field)] text-[var(--color-ground)]"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-mark)] text-[var(--color-field)] t-utility px-3 py-1">
                    Most popular
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <Utility
                      className={
                        tier.highlighted
                          ? "!text-[var(--color-field)] opacity-80"
                          : "opacity-70"
                      }
                    >
                      {tier.name}
                    </Utility>
                    <Caption
                      className={`!mt-2 ${
                        tier.highlighted
                          ? "!text-[var(--color-field)] !opacity-80"
                          : "!opacity-75"
                      }`}
                    >
                      {tier.description}
                    </Caption>
                  </div>
                  <Index
                    className={
                      tier.highlighted
                        ? "!text-[var(--color-mark)]"
                        : "!text-[var(--color-mark)]"
                    }
                  >
                    {tier.code}
                  </Index>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`t-display !leading-none ${
                      tier.highlighted
                        ? "text-[var(--color-field)]"
                        : "text-[var(--color-ground)]"
                    }`}
                  >
                    ${tier.price}
                  </span>
                  <Body
                    className={
                      tier.highlighted
                        ? "!text-[var(--color-field)] !opacity-70"
                        : "!opacity-70"
                    }
                  >
                    /mo
                  </Body>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-baseline gap-2.5"
                    >
                      <Index className="shrink-0">→</Index>
                      <Body
                        className={
                          tier.highlighted
                            ? "!text-[var(--color-field)]"
                            : "!text-[var(--color-ground)]"
                        }
                      >
                        {f}
                      </Body>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={
                    tier.highlighted
                      ? "btn btn-mark justify-center"
                      : "btn justify-center"
                  }
                >
                  {tier.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 bg-[var(--color-field-soft)] border-y-2 border-[var(--color-ground)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <H2 className="mb-3">Frequently asked.</H2>
            <Body className="text-[var(--color-ground)] opacity-75">
              The questions every prospect emails us during their trial.
            </Body>
          </div>
          <div className="flex flex-col border-2 border-[var(--color-ground)] bg-[var(--color-field)] divide-y-2 divide-[var(--color-ground)]/15">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={item.q}
                className="group p-5 sm:p-6"
                open={i === 0}
              >
                <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                  <Body className="font-bold text-[var(--color-ground)] !leading-snug">
                    {item.q}
                  </Body>
                  <span
                    aria-hidden
                    className="text-[var(--color-mark)] font-black text-xl leading-none mt-1 transition-transform group-open:rotate-45 select-none"
                  >
                    +
                  </span>
                </summary>
                <Body className="mt-3 text-[var(--color-ground)] leading-relaxed">
                  {item.a}
                </Body>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <H2 className="mb-3">Not ready yet? Join the cohort waitlist.</H2>
          <Body className="text-[var(--color-ground)] opacity-75 mb-8">
            We onboard cohorts state-by-state. Tell us where you operate and
            we&apos;ll move you up the queue when your jurisdiction goes live.
            Outside the US? Drop your email and we&apos;ll notify you when we
            expand.
          </Body>
          <WaitlistForm />
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
