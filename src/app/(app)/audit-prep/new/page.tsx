"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { FormField } from "@/components/doctrine/FormField";

export default function NewBinderPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    agency: "",
    scope: "",
    inspection_date: "",
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
      const res = await fetch("/api/audit-binders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          agency: form.agency.trim() || null,
          scope: form.scope.trim() || null,
          inspection_date: form.inspection_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create binder.");
        return;
      }
      router.push(`/audit-prep/${data.id}`);
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
        <div className="t-utility mb-2">PA-AUD / NEW</div>
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
          Start a binder
        </h1>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField label="Binder name" htmlFor="name">
          <input
            id="name"
            type="text"
            required
            autoFocus
            placeholder="e.g. Q3 health inspection · main location"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="Agency / inspection type" htmlFor="agency">
          <input
            id="agency"
            type="text"
            placeholder="e.g. Cook County Public Health"
            value={form.agency}
            onChange={(e) => update("agency", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="Inspection date (if scheduled)" htmlFor="inspection_date">
          <input
            id="inspection_date"
            type="date"
            value={form.inspection_date}
            onChange={(e) => update("inspection_date", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="Scope notes" htmlFor="scope">
          <textarea
            id="scope"
            rows={4}
            placeholder="What the surveyor is looking at — credentials, equipment, specific licenses, etc."
            value={form.scope}
            onChange={(e) => update("scope", e.target.value)}
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
            {submitting ? "Creating…" : "Create binder →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
