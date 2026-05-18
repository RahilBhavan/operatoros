"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StampChip } from "@/components/doctrine/StampChip";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-6 py-10">
      <StampChip tone="mark">System fault · 500</StampChip>
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
        Route dropped.
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
        An unexpected error stopped this request from completing. The incident
        has been logged. Retry, or head back to your dashboard.
      </p>
      {error.digest ? (
        <div className="t-utility text-[var(--color-ground)]">
          Reference · {error.digest}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button onClick={reset} className="btn btn-mark">
          Retry →
        </button>
        <Link href="/dashboard" className="btn btn-ghost">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
