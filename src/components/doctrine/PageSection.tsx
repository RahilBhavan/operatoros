import { type ReactNode } from "react";

type PageSectionProps = {
  title: ReactNode;
  /** Short line under the title bar (inside the panel). */
  subtitle?: ReactNode;
  count?: number | string;
  /** Mark header bar red for urgent sections */
  tone?: "default" | "mark";
  children: ReactNode;
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PageSection — bordered list panel with ink header bar.
 */
export function PageSection({
  title,
  subtitle,
  count,
  tone = "default",
  children,
  className,
}: PageSectionProps) {
  const countLabel =
    count === undefined
      ? null
      : typeof count === "number"
        ? String(count).padStart(2, "0")
        : count;

  return (
    <section className={clsx("border-2 border-[var(--color-ground)]", className)}>
      <div
        className={clsx(
          "px-4 py-2 flex items-center justify-between gap-2",
          tone === "mark" ? "bg-[var(--color-mark)]" : "panel-ink",
        )}
      >
        <span className="t-utility text-[var(--color-field)]">{title}</span>
        {countLabel !== null ? (
          <span className="t-utility tabular-nums shrink-0 text-[var(--color-field)]">
            {countLabel}
          </span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="t-caption px-4 py-2 border-b-2 border-[var(--color-ground)] bg-[var(--color-field)] text-[var(--color-ground)]">
          {subtitle}
        </p>
      ) : null}
      {children}
    </section>
  );
}
