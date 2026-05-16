import { type ReactNode } from "react";

type Variant = "field" | "ground" | "mark";

type FieldProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  /** Container max-width — defaults to 1100px (12-col grid × 88px column). */
  maxWidth?: number;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * A full-bleed page section in one of the three doctrine colors.
 * Use to alternate the page rhythm — never mix two variants in one Field.
 */
export function Field({
  variant = "field",
  children,
  className,
  maxWidth = 1100,
}: FieldProps) {
  const bg = {
    field: "bg-[var(--color-field)] text-[var(--color-ground)]",
    ground: "bg-[var(--color-ground)] text-[var(--color-field)]",
    mark: "bg-[var(--color-mark)] text-[var(--color-field)]",
  }[variant];

  return (
    <section className={clsx("w-full px-6 py-16 sm:py-24", bg, className)}>
      <div className="mx-auto" style={{ maxWidth }}>
        {children}
      </div>
    </section>
  );
}
