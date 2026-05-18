"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { FormField } from "@/components/doctrine/FormField";

export default function NewCoiRecipientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    requirements: "",
    recurring: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/coi/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          requirements: form.requirements.trim() || null,
          recurring: form.recurring,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add recipient.");
        return;
      }
      router.push(`/coi/recipients/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[680px] flex flex-col gap-6">
      <header className="border-b-2 border-[var(--color-ground)] pb-5">
        <div className="t-utility mb-2">PA-COI / NEW</div>
        <h1
          style={{
            fontFamily: "var(--font-destination)",
            fontWeight: 900,
            fontSize: 44,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Add COI recipient
        </h1>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField label="Recipient name" htmlFor="name">
          <input
            id="name"
            type="text"
            required
            autoFocus
            placeholder="e.g. Main Street GC, LLC"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="Address" htmlFor="address">
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="Coverage requirements" htmlFor="requirements">
          <textarea
            id="requirements"
            rows={4}
            placeholder="e.g. $1M/$2M GL, additional insured = recipient, primary & non-contributory"
            value={form.requirements}
            onChange={(e) => update("requirements", e.target.value)}
            className="t-input"
          />
        </FormField>
        <label className="flex items-center gap-2 t-utility">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) => update("recurring", e.target.checked)}
          />
          Recurring — auto-prompt me to re-issue on every policy renewal
        </label>

        {error ? (
          <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-3">
            <div className="t-utility" style={{ color: "var(--color-field)" }}>
              Error
            </div>
            <p className="text-[14px] mt-1" style={{ fontFamily: "var(--font-index)" }}>
              {error}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-5 border-t-2 border-[var(--color-ground)]">
          <button
            type="button"
            onClick={() => router.back()}
            className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)]"
          >
            ← Cancel
          </button>
          <Button type="submit" variant="mark" disabled={submitting}>
            {submitting ? "Saving…" : "Add recipient →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
