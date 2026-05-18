"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { FormField } from "@/components/doctrine/FormField";
import { useToast } from "@/components/doctrine/Toast";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

type Initial = {
  id: string;
  name: string;
  state: string;
  city: string;
  address: string;
  zip: string;
  county: string;
  open_date: string;
};

export default function EditLocationForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    name: initial.name ?? "",
    state: initial.state ?? "",
    city: initial.city ?? "",
    address: initial.address ?? "",
    zip: initial.zip ?? "",
    county: initial.county ?? "",
    open_date: initial.open_date ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stateError, setStateError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.state) {
      setStateError("State is required.");
      return;
    }
    setStateError("");
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/locations/${initial.id}`, {
        method: "PATCH",
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
        const msg = data.error ?? "Failed to save changes.";
        setError(msg);
        toast.error("Save failed", msg);
        return;
      }
      toast.success("Location updated", form.name || form.city || form.state);
      router.push(`/locations/${initial.id}`);
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
      <FormField label="State" htmlFor="state" error={stateError}>
        <select
          id="state"
          required
          value={form.state}
          onChange={(e) => {
            update("state", e.target.value);
            if (stateError) setStateError("");
          }}
          aria-invalid={stateError ? "true" : undefined}
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
          {submitting ? "Saving…" : "Save changes →"}
        </Button>
      </div>
    </form>
  );
}
