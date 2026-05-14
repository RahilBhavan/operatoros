"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanTier } from "@/lib/stripe";

interface Props {
  plan?: PlanTier;
  hasCustomer: boolean;
  isSubscribed?: boolean;
  buttonLabel?: string;
  highlighted?: boolean;
}

export default function BillingActions({
  plan,
  hasCustomer,
  isSubscribed,
  buttonLabel = "Get started",
  highlighted = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!plan) return;
    setLoading(true);

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);

    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  // Manage subscription button (no plan = portal only)
  if (!plan && hasCustomer) {
    return (
      <button
        onClick={handlePortal}
        disabled={loading}
        className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
      >
        {loading ? "Loading…" : "Manage subscription"}
      </button>
    );
  }

  if (!plan) return null;

  // Switch plan via portal
  if (isSubscribed && hasCustomer) {
    return (
      <button
        onClick={handlePortal}
        disabled={loading}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          highlighted
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
        } disabled:opacity-50`}
      >
        {loading ? "Loading…" : buttonLabel}
      </button>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        highlighted
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
      } disabled:opacity-50`}
    >
      {loading ? "Loading…" : buttonLabel}
    </button>
  );
}
