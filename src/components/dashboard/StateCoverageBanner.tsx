"use client";

import { useState } from "react";
import { Button } from "@/components/doctrine/Button";

interface Props {
  state: string;
  industrySlug?: string | null;
}

/**
 * Template-fallback states get a banner naming the gap honestly + a CTA
 * to request priority deep curation. Matches the WS-0.4 acceptance criterion:
 * "Each template-fallback state has a 'request priority curation' CTA whose
 * backlog feeds WS-1.3 sequencing."
 */
export default function StateCoverageBanner({ state, industrySlug }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          state,
          industry_slug: industrySlug ?? undefined,
          utm_source: "state-coverage-request",
          utm_medium: "in-app-banner",
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        setError(data.error ?? "Failed to submit request.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-2 border-[var(--color-ground)]">
      <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <span className="t-utility" style={{ color: "var(--color-field)" }}>
          State coverage · {state}
        </span>
        <span className="t-utility" style={{ color: "var(--color-field)" }}>
          Template fallback
        </span>
      </div>
      <div className="bg-[var(--color-field)] px-4 py-3 flex flex-col gap-3">
        <p className="text-[14px]" style={{ fontFamily: "var(--font-index)" }}>
          Federal deadlines for {state} are deep. State-specific deadlines are
          on a template fallback — common annual filings are covered, but
          county- and industry-specific obligations may not be. Deep curation
          for {state} is in progress. Five states (CA · TX · NY · DE · FL)
          ship deeply curated today.
        </p>
        {submitted ? (
          <p
            className="text-[14px] text-[var(--color-mark)]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            ✓ Logged. We&apos;ll email you when {state} ships deep coverage.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 flex-1 min-w-[220px]">
              <span className="t-utility">Email for updates</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="t-input"
              />
            </label>
            <Button
              variant="mark"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Request priority curation →"}
            </Button>
          </form>
        )}
        {error ? (
          <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] px-3 py-2">
            <div className="t-utility" style={{ color: "var(--color-field)" }}>
              Error
            </div>
            <p
              className="text-[13px] mt-1"
              style={{
                fontFamily: "var(--font-index)",
                color: "var(--color-field)",
              }}
            >
              {error}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
