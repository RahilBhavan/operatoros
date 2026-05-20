import { type ReactNode } from "react";
import { Body } from "@/components/doctrine/Typography";

type PageHeaderProps = {
  /** Small caps route code, e.g. PA-COI */
  code?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  /** Slightly smaller title for edit/sub-pages */
  size?: "default" | "compact";
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PageHeader — shared page title block with optional lead and actions.
 */
export function PageHeader({
  code,
  title,
  description,
  meta,
  actions,
  size = "default",
  className,
}: PageHeaderProps) {
  return (
    <header
      className={clsx(
        "border-b-4 border-[var(--color-ground)] pb-3 flex items-end justify-between flex-wrap gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {code ? (
          <p className="t-caption mb-1.5 text-[var(--color-ground)]/75 normal-case tracking-normal">
            {code}
          </p>
        ) : null}
        <h1
          className={clsx(
            "t-page-title",
            size === "compact" && "t-page-title--compact",
          )}
        >
          {title}
        </h1>
        {description ? (
          <Body className="mt-2 max-w-[42rem] text-[var(--color-ground)]">
            {description}
          </Body>
        ) : null}
        {meta ? (
          <p className="t-caption mt-2 text-[var(--color-ground)] normal-case tracking-normal">
            {meta}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
