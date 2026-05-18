"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/doctrine/Button";

interface Props {
  recipientId: string;
}

export default function IssueCoiForm({ recipientId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    effective_date: "",
    expiry_date: "",
    delivery_channel: "email",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.expiry_date) {
      setError("Expiry date is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/coi/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: recipientId,
          effective_date: form.effective_date || null,
          expiry_date: form.expiry_date,
          delivery_channel: form.delivery_channel,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to log issuance.");
        return;
      }
      setForm({
        effective_date: "",
        expiry_date: "",
        delivery_channel: "email",
        notes: "",
      });
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-2 border-[var(--color-ground)]">
      <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-5 py-3">
        <span className="t-utility" style={{ color: "var(--color-field)" }}>
          Log issuance
        </span>
      </div>
      <form
        onSubmit={onSubmit}
        className="bg-[var(--color-field)] px-4 py-3 grid sm:grid-cols-2 gap-4"
      >
        <label className="flex flex-col gap-1">
          <span className="t-utility">Effective date</span>
          <input
            type="date"
            value={form.effective_date}
            onChange={(e) => update("effective_date", e.target.value)}
            className="t-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-utility">Expiry date</span>
          <input
            type="date"
            required
            value={form.expiry_date}
            onChange={(e) => update("expiry_date", e.target.value)}
            className="t-input"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="t-utility">Delivery channel</span>
          <select
            value={form.delivery_channel}
            onChange={(e) => update("delivery_channel", e.target.value)}
            className="t-input"
          >
            <option value="email">Email to recipient</option>
            <option value="share_link">OperatorOS share link</option>
            <option value="manual">Manual / handoff</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="t-utility">Notes</span>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="t-input"
          />
        </label>
        {error ? (
          <div className="sm:col-span-2 border-2 border-[var(--color-mark)] bg-[var(--color-mark)] px-3 py-2">
            <p
              className="text-[13px]"
              style={{
                fontFamily: "var(--font-index)",
                color: "var(--color-field)",
              }}
            >
              {error}
            </p>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" variant="ground" disabled={submitting}>
            {submitting ? "Logging…" : "Log issuance →"}
          </Button>
        </div>
      </form>
    </section>
  );
}
