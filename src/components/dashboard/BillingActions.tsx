"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaidPlanTier } from "@/lib/stripe";
import { Button, Caption } from "@/components/doctrine";

interface Props {
  plan?: PaidPlanTier;
  hasCustomer: boolean;
  isSubscribed?: boolean;
  buttonLabel?: string;
  highlighted?: boolean;
}

export default function BillingActions({
  plan,
  hasCustomer,
  isSubscribed,
  buttonLabel = "Get started →",
  highlighted = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!plan) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Failed to start checkout.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Failed to open billing portal.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // Manage subscription button (no plan = portal only)
  if (!plan && hasCustomer) {
    return (
      <div className="flex flex-col gap-1">
        <Button onClick={handlePortal} disabled={loading} variant="ghost">
          {loading ? "Loading…" : "Reroute plan →"}
        </Button>
        {error && (
          <Caption className="!text-[var(--color-mark)] !opacity-100">
            {error}
          </Caption>
        )}
      </div>
    );
  }

  if (!plan) return null;

  const variant = highlighted ? "mark" : "ground";

  if (isSubscribed && hasCustomer) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <Button
          onClick={handlePortal}
          disabled={loading}
          variant={variant}
          className="w-full justify-center"
        >
          {loading ? "Loading…" : buttonLabel}
        </Button>
        {error && (
          <Caption className="!text-[var(--color-mark)] !opacity-100">
            {error}
          </Caption>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <Button
        onClick={handleCheckout}
        disabled={loading}
        variant={variant}
        className="w-full justify-center"
      >
        {loading ? "Loading…" : buttonLabel}
      </Button>
      {error && (
        <Caption className="!text-[var(--color-mark)] !opacity-100">
          {error}
        </Caption>
      )}
    </div>
  );
}
