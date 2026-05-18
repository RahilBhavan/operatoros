import { type ReactNode } from "react";

type Variant = "ground" | "field" | "mark";

type TagCardProps = {
  /** The 3-letter destination code shown huge in the saturated block (e.g. JFK, OPS, $79). */
  destination?: ReactNode;
  /** Caption beneath the destination (e.g. NEW YORK, "BUSINESS PLAN"). */
  subtitle?: ReactNode;
  /** Top corner code (e.g. "201678", a deadline id). */
  topCode?: ReactNode;
  /** Top-right small caps (e.g. "FINAL DESTINATION" or "PA-JFK"). */
  topRight?: ReactNode;
  /** The kraft tab label (e.g. "PA-JFK", "DUE-Q1"). Includes punched hole. */
  tabLabel?: ReactNode;
  /** Sort symbol arrow letter (A/B/C). */
  sortSymbol?: string;
  /** Reference number in the lower split (e.g. "P-2, 201-678"). */
  refNumber?: ReactNode;
  /** Full body content (alternative to the split-color layout). */
  children?: ReactNode;
  /** Color block variant — which color saturates the top block. */
  variant?: Variant;
  /** Render bottom die-cut perforation edge. */
  perforated?: boolean;
  /** Inline custom className. */
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * TagCard — the canonical Pan Am-style two-tone artifact.
 *
 * Visual structure:
 *   ┌──────────────────────────┐
 *   │ topCode   [tab]  topRight│   ← color-block "Field" (saturated)
 *   │                          │
 *   │      DESTINATION         │
 *   │      subtitle            │
 *   │  refNumber               │
 *   ├──────────────────────────┤   ← split at ~60%
 *   │ OperatorOS  [SORT → C]   │   ← cream "Ground"
 *   │     (children if any)    │
 *   └──── ⌒⌒⌒⌒⌒⌒⌒⌒⌒⌒⌒ ────────┘   ← optional die-cut perforation
 */
export function TagCard({
  destination,
  subtitle,
  topCode,
  topRight,
  tabLabel,
  sortSymbol,
  refNumber,
  children,
  variant = "ground",
  perforated = true,
  className,
}: TagCardProps) {
  const fieldBg = {
    ground: "bg-[var(--color-ground)] text-[var(--color-field)]",
    field: "bg-[var(--color-field)] text-[var(--color-ground)]",
    mark: "bg-[var(--color-mark)] text-[var(--color-field)]",
  }[variant];

  const groundBg = "bg-[var(--color-field)] text-[var(--color-ground)]";

  return (
    <div
      className={clsx(
        "relative border-2 border-[var(--color-ground)] flex flex-col",
        perforated && "tag-perforated",
        className,
      )}
    >
      {/* Saturated field block */}
      <div className={clsx("relative px-5 pt-5 pb-6", fieldBg)}>
        {/* Top metadata strip: code · tab · code */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            {topCode ? (
              <span className="t-index text-current  text-[13px]">
                {topCode}
              </span>
            ) : null}
          </div>

          {tabLabel ? (
            <span className="tag-tab -mt-5">{tabLabel}</span>
          ) : null}

          <div className="flex-1 text-right">
            {topRight ? (
              <span className="t-utility  text-[11px]">
                {topRight}
              </span>
            ) : null}
          </div>
        </div>

        {/* Destination headline — clamped to preserve the artifact's proportion.
            The doctrine: the tag holds its shape; content must fit, not stretch.
            Single-line, with type sized down by viewport so long words never wrap-bleed. */}
        {destination ? (
          <div
            className="text-current font-black tracking-tight leading-none mb-1 overflow-hidden whitespace-nowrap"
            style={{
              fontFamily: "var(--font-destination), Inter, system-ui, sans-serif",
              fontSize: "clamp(40px, 9vw, 75px)",
              letterSpacing: "-0.03em",
              textOverflow: "ellipsis",
              wordBreak: "keep-all",
            }}
            title={typeof destination === "string" ? destination : undefined}
          >
            {destination}
          </div>
        ) : null}

        {subtitle ? (
          <div className="t-h2 text-current  -mt-1">{subtitle}</div>
        ) : null}

        {/* Reference number — straddles the split */}
        {refNumber ? (
          <div className="t-index text-current mt-5 text-[28px] leading-none">
            {refNumber}
          </div>
        ) : null}
      </div>

      {/* Ground (cream) block */}
      <div className={clsx("px-5 pt-5 pb-7 flex-1", groundBg)}>
        {children}

        {sortSymbol ? (
          <div className="flex items-center justify-end mt-4">
            <span className="sort-arrow">
              <span className="sort-arrow__label">
                Sorting<br />Symbol →
              </span>
              <span className="sort-arrow__letter">{sortSymbol}</span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
