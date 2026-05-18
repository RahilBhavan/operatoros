"use client";

import { useEffect } from "react";

export default function SharePortalError({
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
    <div className="min-h-screen bg-[var(--color-field)] flex items-center justify-center px-6 py-16">
      <div className="max-w-[520px] w-full border-2 border-[var(--color-ground)] bg-[var(--color-field)]">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3">
          <span className="t-utility !text-[var(--color-field)]">
            Portal · 500
          </span>
        </div>
        <div className="px-5 py-6 flex flex-col gap-4">
          <h1
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: 30,
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
              color: "var(--color-ground)",
            }}
          >
            Portal temporarily unavailable.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-index)",
              fontSize: 15,
              lineHeight: 1.55,
              color: "var(--color-ground)",
            }}
          >
            We couldn&apos;t load this shared view. The link itself is still
            valid — try again.
          </p>
          {error.digest ? (
            <div className="t-utility text-[var(--color-ground)]">
              Reference · {error.digest}
            </div>
          ) : null}
          <button onClick={reset} className="btn btn-mark self-start">
            Retry →
          </button>
        </div>
      </div>
    </div>
  );
}
