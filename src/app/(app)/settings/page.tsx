import Link from "next/link";

export default function SettingsIndex() {
  const SECTIONS = [
    {
      href: "/settings/team",
      title: "Team",
      blurb: "Invite admins and members; manage access.",
    },
    {
      href: "/settings/notifications",
      title: "Notifications",
      blurb: "Email + SMS reminder preferences, severity thresholds, quiet hours.",
    },
    {
      href: "/settings/integrations",
      title: "Integrations",
      blurb: "SimplePractice, QuickBooks Online, Karbon, TaxDome.",
    },
    {
      href: "/settings/baa",
      title: "HIPAA · Business Associate Agreement",
      blurb: "Required if you store PHI-adjacent docs (healthcare verticals).",
    },
    {
      href: "/settings/network",
      title: "Network growth",
      blurb:
        "Accountant plan only — track signups and paid conversions from clients you invite.",
    },
    {
      href: "/billing",
      title: "Billing",
      blurb: "Manage subscription, plan, and payment method.",
    },
  ];
  return (
    <div className="flex flex-col gap-8 max-w-[720px]">
      <header className="border-b-2 border-[var(--color-ground)] pb-5">
        <div className="t-utility mb-2">PA-SET</div>
        <h1
          style={{
            fontFamily: "var(--font-destination)",
            fontWeight: 900,
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Settings
        </h1>
      </header>

      <section className="border-2 border-[var(--color-ground)]">
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
                className="px-5 py-4 flex items-center justify-between no-underline hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
              >
                <div>
                  <div
                    className="font-bold text-[15px]"
                    style={{ fontFamily: "var(--font-index)" }}
                  >
                    {s.title}
                  </div>
                  <div className="t-utility mt-1">{s.blurb}</div>
                </div>
                <span className="t-utility shrink-0">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
