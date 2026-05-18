import { type CSSProperties } from "react";

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Skeleton — solid Ink placeholder for loading content. Wipe animation is
 * CSS-driven (`.skeleton`) — no opacity, no gradient.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  className,
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`skeleton ${className ?? ""}`}
      style={{ width, height, ...style }}
    />
  );
}
