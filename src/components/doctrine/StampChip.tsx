import { type ReactNode } from "react";

type Tone = "ground" | "mark" | "field";

type StampChipProps = {
  tone?: Tone;
  /** Render a leading 8px square dot in currentColor. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * StampChip — the routing stamp. Destination codes, statuses, route stamps.
 * Three tones, no rounding, never tinted.
 */
export function StampChip({
  tone = "ground",
  dot = false,
  className,
  children,
}: StampChipProps) {
  const cls = {
    ground: "stamp-chip",
    mark: "stamp-chip stamp-chip--mark",
    field: "stamp-chip stamp-chip--field",
  }[tone];
  return (
    <span className={clsx(cls, className)}>
      {dot ? <span className="stamp-chip__dot" aria-hidden /> : null}
      {children}
    </span>
  );
}
