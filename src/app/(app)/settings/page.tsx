import Link from "next/link";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";
import { Body } from "@/components/doctrine/Typography";

const SECTIONS = [
  {
    href: "/settings/team",
    title: "Team",
    blurb: "Invite admins and members; manage access.",
  },
  {
    href: "/settings/notifications",
    title: "Notifications",
    blurb: "Email and SMS reminders, severity thresholds, quiet hours.",
  },
  {
    href: "/settings/integrations",
    title: "Integrations",
    blurb: "SimplePractice, QuickBooks Online, Karbon, TaxDome.",
  },
  {
    href: "/settings/baa",
    title: "HIPAA · Business Associate Agreement",
    blurb: "Required if you store PHI-adjacent documents.",
  },
  {
    href: "/settings/network",
    title: "Network growth",
    blurb: "Accountant plan — track signups from clients you invite.",
  },
  {
    href: "/billing",
    title: "Billing",
    blurb: "Subscription, plan tier, and payment method.",
  },
] as const;

export default function SettingsIndex() {
  return (
    <PageShell width="narrow">
      <PageHeader
        code="Account & workspace"
        title="Settings"
        description="Account, team, reminders, integrations, and billing."
      />

      <PageSection title="Sections" count={SECTIONS.length}>
        <ul className="bg-[var(--color-field)]">
          {SECTIONS.map((s, i) => (
            <li
              key={s.href}
              className={
                i === SECTIONS.length - 1
                  ? ""
                  : "border-b border-[var(--color-ground)]"
              }
            >
              <Link
                href={s.href}
                className="px-4 py-3 flex items-center justify-between gap-4 no-underline hover:bg-[var(--color-ground)] hover:text-[var(--color-field)] group"
              >
                <div className="min-w-0">
                  <Body className="font-bold group-hover:text-[var(--color-field)]">
                    {s.title}
                  </Body>
                  <p className="t-utility mt-1 group-hover:text-[var(--color-field)]">
                    {s.blurb}
                  </p>
                </div>
                <span className="t-utility shrink-0">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      </PageSection>
    </PageShell>
  );
}
