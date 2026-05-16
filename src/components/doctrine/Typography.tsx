import { type ReactNode, type ElementType } from "react";

type TypographyProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Destination({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "h1") as ElementType;
  return <Tag className={clsx("t-destination", className)}>{children}</Tag>;
}

export function Marquee({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "h1") as ElementType;
  return <Tag className={clsx("t-marquee", className)}>{children}</Tag>;
}

export function Display({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "h2") as ElementType;
  return <Tag className={clsx("t-display", className)}>{children}</Tag>;
}

export function H1({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "h1") as ElementType;
  return <Tag className={clsx("t-h1", className)}>{children}</Tag>;
}

export function H2({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "h2") as ElementType;
  return <Tag className={clsx("t-h2", className)}>{children}</Tag>;
}

export function H3({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "h3") as ElementType;
  return <Tag className={clsx("t-h3", className)}>{children}</Tag>;
}

export function Subhead({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "p") as ElementType;
  return <Tag className={clsx("t-subhead", className)}>{children}</Tag>;
}

export function Body({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "p") as ElementType;
  return <Tag className={clsx("t-body", className)}>{children}</Tag>;
}

export function Caption({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "p") as ElementType;
  return <Tag className={clsx("t-caption", className)}>{children}</Tag>;
}

/**
 * Utility tier — small caps with generous tracking.
 * Use for FINAL DESTINATION, FLIGHT NUMBER, SORTING SYMBOL, section names.
 */
export function Utility({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "span") as ElementType;
  return <Tag className={clsx("t-utility", className)}>{children}</Tag>;
}

/**
 * Index tier — slab serif red, tabular numerals.
 * Use for codes, IDs, reference numbers, dates, money exposure.
 */
export function Index({ as, children, className }: TypographyProps) {
  const Tag = (as ?? "span") as ElementType;
  return <Tag className={clsx("t-index", className)}>{children}</Tag>;
}
