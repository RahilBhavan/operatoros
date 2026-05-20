"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";
import { FormField } from "@/components/doctrine/FormField";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export default function NewLocationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    state: "",
    city: "",
    address: "",
    zip: "",
    county: "",
    open_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.state) {
      setError("State is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || null,
          state: form.state,
          city: form.city.trim() || null,
          address: form.address.trim() || null,
          zip: form.zip.trim() || null,
          county: form.county.trim() || null,
          open_date: form.open_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add location.");
        return;
      }
      router.push("/locations");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell width="narrow">
      <PageHeader title="New location" size="compact" />

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField label="Location name" htmlFor="name">
          <input
            id="name"
            type="text"
            autoFocus
            placeholder="e.g. Downtown taproom"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="State" htmlFor="state">
          <select
            id="state"
            required
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            className="t-input"
          >
            <option value="">Select…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="City" htmlFor="city">
          <input
            id="city"
            type="text"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="t-input"
          />
        </FormField>
        <FormField label="Street address" htmlFor="address">
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="t-input"
          />
        </FormField>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="ZIP" htmlFor="zip">
            <input
              id="zip"
              type="text"
              value={form.zip}
              onChange={(e) => update("zip", e.target.value)}
              className="t-input"
            />
          </FormField>
          <FormField label="County" htmlFor="county">
            <input
              id="county"
              type="text"
              value={form.county}
              onChange={(e) => update("county", e.target.value)}
              className="t-input"
            />
          </FormField>
        </div>
        <FormField label="Open date" htmlFor="open_date">
          <input
            id="open_date"
            type="date"
            value={form.open_date}
            onChange={(e) => update("open_date", e.target.value)}
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
            {submitting ? "Saving…" : "Add location →"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
