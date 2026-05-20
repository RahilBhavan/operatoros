import { type ReactNode } from "react";
import { Body, H3 } from "@/components/doctrine/Typography";

type SectionBlockProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * SectionBlock — secondary page regions with a readable heading (not full PageHeader).
 */
export function SectionBlock({
  title,
  description,
  action,
  children,
  className,
}: SectionBlockProps) {
  return (
    <section className={clsx("flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between gap-4 flex-wrap border-b-2 border-[var(--color-ground)]/20 pb-3">
        <div className="min-w-0">
          <H3 as="h2">{title}</H3>
          {description ? (
            <Body className="mt-2 max-w-[40rem] text-[var(--color-ground)]/90">
              {description}
            </Body>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
