import Link from "next/link";
import { LinkButton } from "@/components/doctrine/Button";
import { Wordmark } from "@/components/doctrine/Wordmark";

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
      className="w-full bg-[var(--color-field)] border-t-4 border-b border-t-[var(--color-ground)] border-b-[var(--color-ground)]"
    >
      <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-6 px-6 py-4">
        <Wordmark size={20} />

        <div className="hidden md:flex items-center gap-7">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] transition-colors no-underline"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] transition-colors no-underline"
          >
            Sign in
          </Link>
          <LinkButton href="/sign-up" variant="mark">
            Start free trial →
          </LinkButton>
        </div>
      </div>
    </nav>
  );
}
