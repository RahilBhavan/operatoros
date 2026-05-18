"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { FormField } from "@/components/doctrine/FormField";
import { useToast } from "@/components/doctrine/Toast";

type Initial = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  employment_type: string;
  hire_date: string;
};

export default function EditStaffForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [form, setForm] = useState({
    full_name: initial.full_name ?? "",
    email: initial.email ?? "",
    role: initial.role ?? "",
    employment_type: initial.employment_type ?? "w2",
    hire_date: initial.hire_date ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setNameError("Name is required.");
      return;
    }
    setNameError("");
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          role: form.role.trim() || null,
          employment_type: form.employment_type,
          hire_date: form.hire_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to save changes.";
        setError(msg);
        toast.error("Save failed", msg);
        return;
      }
      toast.success("Staff updated", form.full_name.trim());
      router.push(`/staff/${initial.id}`);
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
      <FormField label="Full name" htmlFor="full_name" error={nameError}>
        <input
          id="full_name"
          type="text"
          required
          autoFocus
          value={form.full_name}
          onChange={(e) => {
            update("full_name", e.target.value);
            if (nameError) setNameError("");
          }}
          onBlur={() => {
            if (!form.full_name.trim()) setNameError("Name is required.");
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
      <FormField label="Role" htmlFor="role">
        <input
          id="role"
          type="text"
          placeholder="e.g. CNA, Foreman, Stylist"
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
          className="t-input"
        />
      </FormField>
      <FormField label="Employment type" htmlFor="employment_type">
        <select
          id="employment_type"
          value={form.employment_type}
          onChange={(e) => update("employment_type", e.target.value)}
          className="t-input"
        >
          <option value="w2">W2 employee</option>
          <option value="1099">1099 contractor</option>
          <option value="volunteer">Volunteer</option>
          <option value="owner">Owner</option>
          <option value="other">Other</option>
        </select>
      </FormField>
      <FormField label="Hire date" htmlFor="hire_date">
        <input
          id="hire_date"
          type="date"
          value={form.hire_date}
          onChange={(e) => update("hire_date", e.target.value)}
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
