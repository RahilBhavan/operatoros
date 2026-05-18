"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Caption, Utility } from "@/components/doctrine";

const TIERS = ["free", "business", "accountant"] as const;
const STATUSES = ["trialing", "active", "past_due", "canceled", "inactive"] as const;

export default function PlanTierForceForm({
  businessId,
  currentTier,
  currentStatus,
}: {
  businessId: string;
  currentTier: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [tier, setTier] = useState(currentTier);
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dirty = tier !== currentTier || status !== currentStatus;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || !reason.trim()) {
      setError("Reason is required for any forced change.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    const res = await fetch(`/api/admin/businesses/${businessId}/plan-tier`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan_tier: tier, billing_status: status, reason }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed");
      return;
    }
    setSuccess("Plan updated. Audit event written.");
    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-3 py-2">
        <Utility className="!text-[var(--color-field)] !text-[12px] mb-1">
          WARNING · OVERRIDE
        </Utility>
        <Caption className="!text-[var(--color-field)] !text-[12px]">
          Forces tier or billing_status without going through Stripe. Use only
          for emergencies (refunds, comp accounts, recovery). Every change is
          logged.
        </Caption>
      </div>

      <label className="flex flex-col gap-1">
        <Utility className="!text-[12px]">PLAN TIER</Utility>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="t-input"
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <Utility className="!text-[12px]">BILLING STATUS</Utility>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="t-input"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <Utility className="!text-[12px]">REASON · RECORDED IN AUDIT</Utility>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="refund — duplicate charge"
          className="t-input"
        />
      </label>

      <Button type="submit" disabled={!dirty || busy} variant="mark">
        {busy ? "APPLYING…" : "FORCE UPDATE →"}
      </Button>

      {error && (
        <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-3 py-2">
          <Caption className="!text-[var(--color-field)]">
            {error}
          </Caption>
        </div>
      )}
      {success && (
        <div className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] px-3 py-2">
          <Caption className="!text-[var(--color-field)]">
            {success}
          </Caption>
        </div>
      )}
    </form>
  );
}
