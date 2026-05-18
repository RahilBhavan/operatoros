"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { FormField } from "@/components/doctrine/FormField";

interface Props {
  businessName: string;
}

export default function AcceptBaaForm({ businessName }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    signer_name: "",
    signer_title: "",
    acknowledged: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.acknowledged) {
      setError("You must acknowledge the agreement before signing.");
      return;
    }
    if (!form.signer_name.trim()) {
      setError("Signer name required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/baa/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer_name: form.signer_name.trim(),
          signer_title: form.signer_title.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to record BAA.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormField label="Signer name" htmlFor="signer_name">
        <input
          id="signer_name"
          type="text"
          required
          value={form.signer_name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, signer_name: e.target.value }))
          }
          className="t-input"
        />
      </FormField>
      <FormField label="Signer title" htmlFor="signer_title">
        <input
          id="signer_title"
          type="text"
          placeholder="e.g. Privacy Officer, Owner, Administrator"
          value={form.signer_title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, signer_title: e.target.value }))
          }
          className="t-input"
        />
      </FormField>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={form.acknowledged}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, acknowledged: e.target.checked }))
          }
        />
        <span
          className="text-[13px]"
          style={{ fontFamily: "var(--font-index)" }}
        >
          On behalf of {businessName}, I have read the Business Associate
          Agreement above and I agree to its terms. I confirm I am authorized
          to bind {businessName} to this agreement.
        </span>
      </label>
      {error ? (
        <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-3">
          <p
            className="text-[14px]"
            style={{
              fontFamily: "var(--font-index)",
              color: "var(--color-field)",
            }}
          >
            {error}
          </p>
        </div>
      ) : null}
      <div>
        <Button type="submit" variant="mark" disabled={submitting}>
          {submitting ? "Recording…" : "Sign BAA →"}
        </Button>
      </div>
    </form>
  );
}
