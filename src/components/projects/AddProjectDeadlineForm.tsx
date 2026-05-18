"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/doctrine/Button";

interface Props {
  projectId: string;
}

export default function AddProjectDeadlineForm({ projectId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    due_date: "",
    governing_agency: "",
    severity_tier: "medium",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.due_date) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/deadlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          due_date: form.due_date,
          governing_agency: form.governing_agency.trim() || null,
          severity_tier: form.severity_tier,
          description: form.description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add deadline.");
        return;
      }
      setForm({
        name: "",
        due_date: "",
        governing_agency: "",
        severity_tier: "medium",
        description: "",
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
          Add project deadline
        </span>
      </div>
      <form
        onSubmit={onSubmit}
        className="bg-[var(--color-field)] px-5 py-5 grid sm:grid-cols-2 gap-4"
      >
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="t-utility">Deadline name</span>
          <input
            type="text"
            required
            placeholder="e.g. Final electrical inspection"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="t-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-utility">Due date</span>
          <input
            type="date"
            required
            value={form.due_date}
            onChange={(e) => update("due_date", e.target.value)}
            className="t-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-utility">Severity</span>
          <select
            value={form.severity_tier}
            onChange={(e) => update("severity_tier", e.target.value)}
            className="t-input"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="t-utility">Governing agency</span>
          <input
            type="text"
            value={form.governing_agency}
            onChange={(e) => update("governing_agency", e.target.value)}
            className="t-input"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="t-utility">Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
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
            {submitting ? "Adding…" : "Add deadline →"}
          </Button>
        </div>
      </form>
    </section>
  );
}
