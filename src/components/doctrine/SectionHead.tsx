import { type ReactNode } from "react";

type SectionHeadProps = {
  /** Small-caps utility line above the title. */
  kicker?: ReactNode;
  /** The destination headline. */
  title: ReactNode;
  /** Right-side actions (buttons, links). */
  action?: ReactNode;
  /** Rule weight under the head. Default "stamp" (4px Ink). */
  rule?: "hair" | "body" | "stamp" | "none";
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * SectionHead — kicker · title · action, with a doctrine rule below.
 */
export function SectionHead({
  kicker,
  title,
  action,
  rule = "stamp",
  className,
}: SectionHeadProps) {
  const ruleCls = {
    hair: "border-t border-[var(--color-ground)]",
    body: "border-t-2 border-[var(--color-ground)]",
    stamp: "border-t-4 border-[var(--color-ground)]",
    none: "",
  }[rule];

  return (
    <div className={clsx("mb-6", className)}>
      <div className="flex items-end justify-between gap-6 pb-4">
        <div>
          {kicker ? (
            <div className="t-utility text-[var(--color-ground)] mb-2">
              {kicker}
            </div>
          ) : null}
          <div className="t-h2">{title}</div>
        </div>
        {action ? <div className="flex items-center gap-3">{action}</div> : null}
      </div>
      <div className={ruleCls} />
    </div>
  );
}
