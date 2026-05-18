import Link from "next/link";
import { type ReactNode } from "react";

type Crumb = {
  label: ReactNode;
  href?: string;
};

type BreadcrumbProps = {
  items: Crumb[];
  className?: string;
};

/**
 * Breadcrumb — navigation trail above page headers. Last crumb is the current
 * page (not linked); earlier crumbs are links. Uses utility typography and the
 * "·" separator for consistency with the rest of the app.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`t-utility text-[var(--color-ground)] flex items-center flex-wrap gap-x-2 gap-y-1 ${className ?? ""}`}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-2">
            {item.href && !last ? (
              <Link
                href={item.href}
                className="no-underline hover:text-[var(--color-mark)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-[var(--color-mark)]" : ""}>
                {item.label}
              </span>
            )}
            {last ? null : <span aria-hidden>·</span>}
          </span>
        );
      })}
    </nav>
  );
}
