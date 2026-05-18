"use client";

import { useEffect } from "react";
import { StampChip } from "@/components/doctrine/StampChip";

export default function AdminError({
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
      <StampChip tone="mark">System fault · admin · 500</StampChip>
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
        Admin route dropped.
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
        An unexpected error stopped this admin request from completing. The
        incident has been logged.
      </p>
      {error.digest ? (
        <div className="t-utility text-[var(--color-ground)]">
          Reference · {error.digest}
        </div>
      ) : null}
      <button onClick={reset} className="btn btn-mark">
        Retry →
      </button>
    </div>
  );
}
