import Link from "next/link";
import { Wordmark } from "@/components/doctrine/Wordmark";

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
      { label: "Support", href: "mailto:support@operatoros.com", external: true },
      { label: "Security disclosure", href: "mailto:security@operatoros.com", external: true },
      { label: "Press", href: "mailto:press@operatoros.com", external: true },
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
    <footer className="w-full panel-ink mt-auto border-t-4 border-[var(--color-ground)]">
      <div className="max-w-[1160px] mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          <div className="flex flex-col gap-4 max-w-xs">
            <span
              className="inline-flex items-baseline leading-none uppercase font-black tracking-tight"
              style={{
                fontFamily: "var(--font-destination)",
                fontWeight: 900,
                fontSize: 20,
                letterSpacing: "0.02em",
                color: "var(--color-field)",
              }}
            >
              OPERATOR<span className="text-[var(--color-mark)]">OS</span>
            </span>
            <p
              className="t-body"
              style={{ color: "var(--color-field)", fontFamily: "var(--font-index)" }}
            >
              The compliance operating system for the 1–50 employee business.
              Built for the owner. Distributed through the accountant.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
            {COLUMNS.map((col) => (
              <div key={col.heading} className="flex flex-col gap-3">
                <h3 className="t-utility text-[var(--color-field)]">
                  {col.heading}
                </h3>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          className="text-[var(--color-field)] hover:text-[var(--color-mark)] no-underline transition-colors text-[15px]"
                          style={{ fontFamily: "var(--font-index)" }}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[var(--color-field)] hover:text-[var(--color-mark)] no-underline transition-colors text-[15px]"
                          style={{ fontFamily: "var(--font-index)" }}
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

        <div className="mt-14 pt-8 border-t border-[var(--color-field)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p
            className="t-utility text-[var(--color-field)]"
            style={{ letterSpacing: "0.18em" }}
          >
            © {new Date().getFullYear()} OperatorOS · Built for 1–50 employee businesses
          </p>
          <Wordmark href={false} size={14} className="!text-[var(--color-field)]" />
        </div>

        <p
          className="mt-6 text-[12px] leading-relaxed"
          style={{ color: "var(--color-field)", fontFamily: "var(--font-index)" }}
        >
          Information provided by OperatorOS is not legal, tax, accounting, or
          compliance advice. Verify obligations with a licensed professional
          before relying on them.
        </p>
      </div>
    </footer>
  );
}
