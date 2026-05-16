"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/doctrine/Wordmark";
import { StampChip } from "@/components/doctrine/StampChip";

export default function GlobalError({
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
    <div className="min-h-screen bg-[var(--color-field)] flex flex-col">
      <header className="border-b border-[var(--color-ground)] px-6 py-5">
        <div className="max-w-[1160px] mx-auto">
          <Wordmark size={20} />
        </div>
      </header>

      <main className="flex-1 flex items-center px-6 py-16">
        <div className="max-w-[680px] mx-auto w-full">
          <StampChip tone="mark">System fault · 500</StampChip>
          <h1
            className="mt-6"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 900,
              fontSize: 60,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "var(--color-ground)",
            }}
          >
            Route dropped.
          </h1>
          <div className="rule-stamp mt-6" />
          <p
            className="mt-6"
            style={{
              fontFamily: "var(--font-index)",
              fontWeight: 400,
              fontSize: 17,
              lineHeight: 1.55,
              color: "var(--color-ground)",
            }}
          >
            An unexpected error stopped this request from completing. The
            incident has been logged. Retry, or head back to the dashboard and
            try again from a known-good route.
          </p>
          {error.digest ? (
            <div className="mt-4 t-utility text-[var(--color-ground)]">
              Reference · {error.digest}
            </div>
          ) : null}
          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={reset} className="btn btn-mark">
              Retry →
            </button>
            <Link href="/dashboard" className="btn btn-ghost">
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
