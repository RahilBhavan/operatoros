"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { FormField } from "@/components/doctrine/FormField";

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    address: "",
    jurisdiction_code: "",
    customer_name: "",
    gc_business_name: "",
    start_date: "",
    end_date: "",
    value: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const valueCents = form.value
        ? Math.round(Number(form.value) * 100)
        : null;
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || null,
          jurisdiction_code: form.jurisdiction_code.trim().toUpperCase() || null,
          customer_name: form.customer_name.trim() || null,
          gc_business_name: form.gc_business_name.trim() || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          value_cents: Number.isFinite(valueCents) ? valueCents : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create project.");
        return;
      }
      router.push(`/projects/${data.id}`);
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
        <div className="t-utility mb-2">PA-PROJ / NEW</div>
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
          New project
        </h1>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField label="Project name" htmlFor="name">
          <input
            id="name"
            type="text"
            required
            autoFocus
            placeholder="e.g. 1234 Main St kitchen remodel"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
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
        <FormField label="Jurisdiction (state)" htmlFor="jurisdiction_code">
          <input
            id="jurisdiction_code"
            type="text"
            maxLength={2}
            placeholder="CA"
            value={form.jurisdiction_code}
            onChange={(e) => update("jurisdiction_code", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="Customer" htmlFor="customer_name">
          <input
            id="customer_name"
            type="text"
            value={form.customer_name}
            onChange={(e) => update("customer_name", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="General contractor (if sub)" htmlFor="gc_business_name">
          <input
            id="gc_business_name"
            type="text"
            value={form.gc_business_name}
            onChange={(e) => update("gc_business_name", e.target.value)}
            className="t-input"
          />
        </FormField>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Start date" htmlFor="start_date">
            <input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={(e) => update("start_date", e.target.value)}
              className="t-input"
            />
          </FormField>
          <FormField label="End date" htmlFor="end_date">
            <input
              id="end_date"
              type="date"
              value={form.end_date}
              onChange={(e) => update("end_date", e.target.value)}
              className="t-input"
            />
          </FormField>
        </div>
        <FormField label="Contract value (USD)" htmlFor="value">
          <input
            id="value"
            type="number"
            step="100"
            min="0"
            value={form.value}
            onChange={(e) => update("value", e.target.value)}
            className="t-input"
          />
        </FormField>

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
            {submitting ? "Creating…" : "Create project →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
