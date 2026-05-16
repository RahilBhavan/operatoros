import Link from "next/link";

type WordmarkProps = {
  /** Render as a link to "/". Set false for footer / static placements. */
  href?: string | false;
  /** Type size in pixels. */
  size?: number;
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Wordmark — OPERATOR<span>OS</span>. Black sans, "OS" in Signal red.
 * The doctrine: the brand never beats the destination. Default size 19pt.
 */
export function Wordmark({ href = "/", size = 19, className }: WordmarkProps) {
  const inner = (
    <span
      className={clsx(
        "inline-flex items-baseline leading-none uppercase font-black tracking-tight text-[var(--color-ground)]",
        className,
      )}
      style={{
        fontFamily: "var(--font-destination)",
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "0.02em",
      }}
    >
      OPERATOR<span className="text-[var(--color-mark)]">OS</span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} aria-label="OperatorOS home" className="inline-flex">
      {inner}
    </Link>
  );
}
