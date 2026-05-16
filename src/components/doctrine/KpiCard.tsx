import { type ReactNode } from "react";

type Tone = "ground" | "mark" | "field";

type KpiCardProps = {
  label: ReactNode;
  value: ReactNode;
  /** Small suffix rendered inline next to the value (e.g. "/100"). */
  suffix?: ReactNode;
  /** Footer line — caption tone. */
  sub?: ReactNode;
  /** Tone determines surface + value color. */
  tone?: Tone;
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * KpiCard — a stat panel for dashboards.
 * Ground: navy panel, white type. Field: white panel with ink rule.
 * Mark: white panel with ink rule, value rendered in Signal red.
 */
export function KpiCard({
  label,
  value,
  suffix,
  sub,
  tone = "ground",
  className,
}: KpiCardProps) {
  const surface = tone === "ground"
    ? "panel-ink"
    : "bg-[var(--color-field)] text-[var(--color-ground)] border-2 border-[var(--color-ground)]";
  const valueClass = tone === "mark"
    ? "text-[var(--color-mark)]"
    : tone === "ground"
      ? "text-[var(--color-field)]"
      : "text-[var(--color-ground)]";

  return (
    <div
      className={clsx(
        "p-6 flex flex-col gap-3 min-h-[132px]",
        surface,
        className,
      )}
    >
      <div className="t-utility">{label}</div>
      <div className="flex items-baseline gap-2">
        <span
          className={clsx("font-black leading-none tracking-tight", valueClass)}
          style={{
            fontFamily: "var(--font-destination)",
            fontSize: 56,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </span>
        {suffix ? (
          <span
            className="t-subhead"
            style={{ fontFamily: "var(--font-index)", fontWeight: 500 }}
          >
            {suffix}
          </span>
        ) : null}
      </div>
      {sub ? (
        <div
          className={clsx(
            "t-utility mt-auto",
            tone === "mark" && "text-[var(--color-mark)]",
          )}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}
