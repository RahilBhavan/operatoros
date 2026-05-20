import { type ReactNode } from "react";
import { Body, H2 } from "@/components/doctrine/Typography";
import { StampChip } from "@/components/doctrine/StampChip";

type PageEmptyStateProps = {
  chip?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function PageEmptyState({
  chip,
  title,
  description,
  actions,
  className,
}: PageEmptyStateProps) {
  return (
    <div
      className={clsx(
        "border-2 border-[var(--color-ground)] p-8 sm:p-10 flex flex-col gap-4 items-start",
        className,
      )}
    >
      {chip ? chip : <StampChip tone="field">Empty</StampChip>}
      <H2>{title}</H2>
      {description ? (
        <Body className="max-w-[30rem]">{description}</Body>
      ) : null}
      {actions ? <span className="mt-1 block">{actions}</span> : null}
    </div>
  );
}
