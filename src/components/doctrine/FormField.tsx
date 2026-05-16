import { type ReactNode } from "react";

type FormFieldProps = {
  /** Small-caps label (always rendered above the control). */
  label: ReactNode;
  /** htmlFor on the label — pair with the control's id for a11y. */
  htmlFor?: string;
  /** Inline error message (mark color, small caps). */
  error?: ReactNode;
  /** Hint shown below the control when no error is present. */
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * FormField — wrap a `.t-input` (or any control) with a doctrine label,
 * optional hint, and inline error. Left-aligned. No centered form labels.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="t-utility text-[var(--color-ground)]">
        {label}
      </label>
      {children}
      {error ? (
        <div className="t-utility text-[var(--color-mark)] !text-[11px]">
          {error}
        </div>
      ) : hint ? (
        <div className="t-caption text-[var(--color-ground)]">{hint}</div>
      ) : null}
    </div>
  );
}
