import Link from "next/link";
import { StampChip } from "@/components/doctrine/StampChip";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-start gap-6 py-10">
      <StampChip tone="mark">Not on the manifest · 404</StampChip>
      <h1
        style={{
          fontFamily: "var(--font-destination)",
          fontWeight: 900,
          fontSize: 48,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          color: "var(--color-ground)",
        }}
      >
        Not found.
      </h1>
      <div className="rule-stamp w-24" />
      <p
        style={{
          fontFamily: "var(--font-index)",
          fontWeight: 400,
          fontSize: 17,
          lineHeight: 1.55,
          color: "var(--color-ground)",
          maxWidth: 560,
        }}
      >
        The page you asked for isn&apos;t routed. It may have moved, or the link
        may be stale. Head back to your dashboard.
      </p>
      <Link href="/dashboard" className="btn">
        Back to dashboard →
      </Link>
    </div>
  );
}
