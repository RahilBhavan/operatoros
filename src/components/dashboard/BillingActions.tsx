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
      <div className="flex flex-col items-start gap-1">
        <button
          onClick={handlePortal}
          disabled={loading}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Manage subscription"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (!plan) return null;

  // Switch plan via portal
  if (isSubscribed && hasCustomer) {
    return (
      <div className="flex flex-col gap-1">
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
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
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
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
