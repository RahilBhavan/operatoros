import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterColumn = {
  heading: string;
  links: FooterLink[];
};

const COLUMNS: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "For accountants", href: "/#accountants" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Contact", href: "mailto:hi@operatoros.com", external: true },
      { label: "Status", href: "/status" },
      { label: "Sign in", href: "/sign-in" },
      { label: "Sign up", href: "/sign-up" },
    ],
  },
  {
    heading: "Resources",
    links: [
      {
        label: "Support",
        href: "mailto:support@operatoros.com",
        external: true,
      },
      {
        label: "Security disclosure",
        href: "mailto:security@operatoros.com",
        external: true,
      },
      {
        label: "Press",
        href: "mailto:press@operatoros.com",
        external: true,
      },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Unsubscribe info", href: "/privacy#cookies" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="w-full bg-[var(--color-ground)] text-[var(--color-field)] mt-auto">
      <div className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          <div className="flex flex-col gap-4 max-w-xs">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-9 h-9 bg-[var(--color-mark)] text-[var(--color-field)] font-black text-xl leading-none"
              >
                O
              </span>
              <span className="t-utility !text-[15px] text-[var(--color-field)]">
                OperatorOS
              </span>
            </div>
            <p className="t-caption text-[var(--color-field)] !opacity-80">
              The compliance operating system for the 1–50 employee business.
              Built for the owner. Distributed through the accountant.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
            {COLUMNS.map((col) => (
              <div key={col.heading} className="flex flex-col gap-3">
                <h3 className="t-utility text-[var(--color-field)] opacity-70">
                  {col.heading}
                </h3>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          className="text-[var(--color-field)] hover:text-[var(--color-mark)] transition-colors text-[15px]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[var(--color-field)] hover:text-[var(--color-mark)] transition-colors text-[15px]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--color-field)]/20 flex flex-col gap-3 text-[12px] text-[var(--color-field)]/70 leading-relaxed">
          <p>
            Information provided by OperatorOS is not legal, tax, accounting, or
            compliance advice. Verify obligations with a licensed professional
            before relying on them.
          </p>
          <p>© {new Date().getFullYear()} OperatorOS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
