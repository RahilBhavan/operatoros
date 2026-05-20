import Link from "next/link";
import { StampChip } from "@/components/doctrine/StampChip";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-start gap-6 py-10">
      <StampChip tone="mark">Admin page not found · 404</StampChip>
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
        Not found in admin area.
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
        The admin route you asked for isn&apos;t wired. Pick a destination from the
        nav above, or head back to the overview.
      </p>
      <Link href="/admin" className="btn">
        Back to admin overview →
      </Link>
    </div>
  );
}
