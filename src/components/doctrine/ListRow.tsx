import Link from "next/link";
import { type ReactNode } from "react";

type ListRowProps = {
  href: string;
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
  /** Optional third column (e.g. compliance score). */
  end?: ReactNode;
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * ListRow — standard linked row inside PageSection lists.
 */
export function ListRow({
  href,
  primary,
  secondary,
  trailing,
  end,
  className,
}: ListRowProps) {
  return (
    <Link
      href={href}
      className={clsx(
        end
          ? "grid grid-cols-[1fr_auto_auto] items-center gap-4 sm:gap-6 px-4 py-3"
          : "grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3",
        "no-underline",
        "hover:bg-[var(--color-ground)] hover:text-[var(--color-field)] group",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="t-body font-bold truncate">{primary}</div>
        {secondary ? (
          <div className="t-utility mt-1 text-[var(--color-ground)] group-hover:text-[var(--color-field)]">
            {secondary}
          </div>
        ) : null}
      </div>
      {trailing ? (
        <div className="t-utility shrink-0 text-right">{trailing}</div>
      ) : null}
      {end ? <div className="shrink-0">{end}</div> : null}
    </Link>
  );
}
