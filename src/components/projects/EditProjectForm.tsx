"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { FormField } from "@/components/doctrine/FormField";
import { useToast } from "@/components/doctrine/Toast";

type Initial = {
  id: string;
  name: string;
  address: string;
  jurisdiction_code: string;
  customer_name: string;
  gc_business_name: string;
  start_date: string;
  end_date: string;
  value: string;
};

export default function EditProjectForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    name: initial.name ?? "",
    address: initial.address ?? "",
    jurisdiction_code: initial.jurisdiction_code ?? "",
    customer_name: initial.customer_name ?? "",
    gc_business_name: initial.gc_business_name ?? "",
    start_date: initial.start_date ?? "",
    end_date: initial.end_date ?? "",
    value: initial.value ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError("Project name is required.");
      return;
    }
    setNameError("");
    setSubmitting(true);
    setError("");
    const valueCents = form.value
      ? Math.round(parseFloat(form.value) * 100)
      : null;
    try {
      const res = await fetch(`/api/projects/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || null,
          jurisdiction_code: form.jurisdiction_code.trim() || null,
          customer_name: form.customer_name.trim() || null,
          gc_business_name: form.gc_business_name.trim() || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          value_cents: Number.isFinite(valueCents as number) ? valueCents : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to save changes.";
        setError(msg);
        toast.error("Save failed", msg);
        return;
      }
      toast.success("Project updated", form.name.trim());
      router.push(`/projects/${initial.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
      toast.error("Network error", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <FormField label="Project name" htmlFor="name" error={nameError}>
        <input
          id="name"
          type="text"
          required
          autoFocus
          value={form.name}
          onChange={(e) => {
            update("name", e.target.value);
            if (nameError) setNameError("");
          }}
          onBlur={() => {
            if (!form.name.trim()) setNameError("Project name is required.");
          }}
          aria-invalid={nameError ? "true" : undefined}
          className="t-input"
        />
      </FormField>
      <FormField label="Customer name" htmlFor="customer_name">
        <input
          id="customer_name"
          type="text"
          value={form.customer_name}
          onChange={(e) => update("customer_name", e.target.value)}
          className="t-input"
        />
      </FormField>
      <FormField label="General contractor" htmlFor="gc_business_name">
        <input
          id="gc_business_name"
          type="text"
          value={form.gc_business_name}
          onChange={(e) => update("gc_business_name", e.target.value)}
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
      <FormField label="Jurisdiction (state code)" htmlFor="jurisdiction_code">
        <input
          id="jurisdiction_code"
          type="text"
          maxLength={10}
          value={form.jurisdiction_code}
          onChange={(e) => update("jurisdiction_code", e.target.value.toUpperCase())}
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
      <FormField label="Project value (USD)" htmlFor="value">
        <input
          id="value"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          placeholder="e.g. 125000"
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
          {submitting ? "Saving…" : "Save changes →"}
        </Button>
      </div>
    </form>
  );
}
