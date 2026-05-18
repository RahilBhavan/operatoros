"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/doctrine/Button";

interface Props {
  deadlineId: string;
  filingKind:
    | "state_annual_report"
    | "fincen_boi"
    | "de_franchise_tax"
    | "business_license_renewal"
    | "food_handler"
    | "liquor_renewal";
  label: string;
  priceCents: number;
  description: string;
  available: boolean;
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function FileItForMeCta({
  deadlineId,
  filingKind,
  label,
  priceCents,
  description,
  available,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onPurchase() {
    if (!available) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/filings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadline_id: deadlineId,
          filing_kind: filingKind,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start filing.");
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-2 border-[var(--color-mark)] bg-[var(--color-field)] p-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="t-utility text-[var(--color-mark)]">
          File this for me
        </span>
        <span
          className="font-bold"
          style={{
            fontFamily: "var(--font-destination)",
            fontSize: 22,
            color: "var(--color-mark)",
          }}
        >
          {dollars(priceCents)}
        </span>
      </div>
      <p
        className="text-[13px]"
        style={{ fontFamily: "var(--font-index)" }}
      >
        {description}
      </p>
      {available ? (
        <Button
          onClick={onPurchase}
          disabled={submitting}
          variant="mark"
          size="sm"
        >
          {submitting ? "Starting…" : `File ${label} →`}
        </Button>
      ) : (
        <div className="t-utility text-[var(--color-ground)]/70">
          Coming soon — partner integration pending.
        </div>
      )}
      {error ? (
        <p
          className="t-utility text-[var(--color-mark)]"
          style={{ color: "var(--color-mark)" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
