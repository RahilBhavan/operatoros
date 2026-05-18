"use client";

import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { StampChip } from "@/components/doctrine/StampChip";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const params = new URLSearchParams(window.location.search);
    const tracking = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      referrer: document.referrer || null,
      landing_path: window.location.pathname,
      referred_by: params.get("ref") ?? null,
      state: state || null,
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), ...tracking }),
      });

      const data: { error?: string; referral_code?: string | null } =
        await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
      setReferralCode(data.referral_code ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyReferralLink() {
    if (!referralCode) return;
    const link = `${window.location.origin}/?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard rejection
    }
  }

  if (submitted) {
    return (
      <div className="max-w-[520px] flex flex-col gap-5">
        <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-5 py-4 flex items-center gap-3">
          <StampChip tone="mark">On list</StampChip>
          <p
            className="t-body"
            style={{ fontFamily: "var(--font-index)" }}
          >
            You&apos;re on the list. Check your email for confirmation.
          </p>
        </div>
        {referralCode ? (
          <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-5">
            <div className="t-utility text-[var(--color-ground)] mb-2">
              Skip the line
            </div>
            <p
              className="t-body mb-4"
              style={{ fontFamily: "var(--font-index)" }}
            >
              Share your invite link. Each signup using it bumps you forward in
              the queue for your state.
            </p>
            <div className="flex gap-2">
              <code
                className="flex-1 px-3 py-2 border-2 border-[var(--color-ground)] text-[12px] font-mono text-[var(--color-ground)] truncate flex items-center bg-[var(--color-field)]"
                style={{ fontFamily: "var(--font-index)" }}
              >
                {`${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${referralCode}`}
              </code>
              <Button
                type="button"
                variant="mark"
                onClick={copyReferralLink}
                className="whitespace-nowrap"
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleWaitlist}
      className="flex flex-col gap-3 max-w-[520px]"
      aria-label="Join the waitlist"
    >
      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="t-input"
        autoComplete="email"
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="waitlist-state" className="sr-only">
          Your state (optional)
        </label>
        <select
          id="waitlist-state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="t-input flex-1"
        >
          <option value="">Your state · optional</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          disabled={loading}
          variant="mark"
          className="whitespace-nowrap"
        >
          {loading ? "Joining…" : "Join waitlist →"}
        </Button>
      </div>
      {error ? (
        <p
          role="alert"
          className="t-utility text-[var(--color-mark)] !text-[11px]"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
