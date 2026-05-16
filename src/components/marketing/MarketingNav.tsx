import Link from "next/link";
import { LinkButton } from "@/components/doctrine/Button";

type NavLink = { label: string; href: string };

const DEFAULT_LINKS: NavLink[] = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "For accountants", href: "/#accountants" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Security", href: "/security" },
];

export function MarketingNav({
  links = DEFAULT_LINKS,
}: {
  links?: NavLink[];
}) {
  return (
    <nav
      aria-label="Primary"
      className="w-full border-b-2 border-[var(--color-ground)] bg-[var(--color-field)]"
    >
      <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          aria-label="OperatorOS home"
        >
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-9 h-9 bg-[var(--color-mark)] text-[var(--color-field)] font-black text-xl leading-none"
          >
            O
          </span>
          <span className="t-utility text-[var(--color-ground)] !text-[15px]">
            OperatorOS
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden sm:inline-flex t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] transition-colors"
          >
            Sign in
          </Link>
          <LinkButton href="/sign-up" variant="mark">
            Start free trial
          </LinkButton>
        </div>
      </div>
    </nav>
  );
}
