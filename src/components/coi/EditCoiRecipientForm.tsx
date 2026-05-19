"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { FormField } from "@/components/doctrine/FormField";
import { useToast } from "@/components/doctrine/Toast";

type Initial = {
  id: string;
  name: string;
  email: string;
  address: string;
  requirements: string;
  recurring: boolean;
};

export default function EditCoiRecipientForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    name: initial.name ?? "",
    email: initial.email ?? "",
    address: initial.address ?? "",
    requirements: initial.requirements ?? "",
    recurring: Boolean(initial.recurring),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError("Name is required.");
      return;
    }
    setNameError("");
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/coi/recipients/${initial.id}`, {
        method: "PATCH",
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
        const msg = data.error ?? "Failed to save changes.";
        setError(msg);
        toast.error("Save failed", msg);
        return;
      }
      toast.success("Recipient updated", form.name.trim());
      router.push(`/coi/recipients/${initial.id}`);
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
      <FormField label="Recipient name" htmlFor="name" error={nameError}>
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
            if (!form.name.trim()) setNameError("Name is required.");
          }}
          aria-invalid={nameError ? "true" : undefined}
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
          {submitting ? "Saving…" : "Save changes →"}
        </Button>
      </div>
    </form>
  );
}
