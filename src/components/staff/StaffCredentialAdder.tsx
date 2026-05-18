"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/doctrine/Button";

interface CredentialType {
  id: string;
  slug: string;
  name: string;
  agency: string | null;
  default_validity_days: number | null;
  vertical_tag: string | null;
}

interface Props {
  staffMemberId: string;
  credentialTypes: CredentialType[];
}

function addDays(base: Date, days: number): string {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function StaffCredentialAdder({
  staffMemberId,
  credentialTypes,
}: Props) {
  const router = useRouter();
  const [credentialTypeId, setCredentialTypeId] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function onTypeChange(id: string) {
    setCredentialTypeId(id);
    // Auto-suggest expiry based on the credential's default validity.
    const t = credentialTypes.find((x) => x.id === id);
    if (t?.default_validity_days && issuedDate) {
      setExpiresDate(addDays(new Date(issuedDate), t.default_validity_days));
    } else if (t?.default_validity_days && !issuedDate) {
      const today = new Date();
      setIssuedDate(today.toISOString().slice(0, 10));
      setExpiresDate(addDays(today, t.default_validity_days));
    }
  }

  function onIssuedChange(d: string) {
    setIssuedDate(d);
    const t = credentialTypes.find((x) => x.id === credentialTypeId);
    if (t?.default_validity_days && d) {
      setExpiresDate(addDays(new Date(d), t.default_validity_days));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!credentialTypeId) {
      setError("Pick a credential type.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/staff/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_member_id: staffMemberId,
          credential_type_id: credentialTypeId,
          identifier: identifier.trim() || null,
          issued_date: issuedDate || null,
          expires_date: expiresDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add credential.");
        return;
      }
      setCredentialTypeId("");
      setIdentifier("");
      setIssuedDate("");
      setExpiresDate("");
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
          Add credential
        </span>
      </div>
      <form
        onSubmit={onSubmit}
        className="bg-[var(--color-field)] px-4 py-3 grid sm:grid-cols-2 gap-4"
      >
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="t-utility">Credential</span>
          <select
            value={credentialTypeId}
            onChange={(e) => onTypeChange(e.target.value)}
            className="t-input"
            required
          >
            <option value="">Pick a credential…</option>
            {credentialTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.agency ? ` · ${t.agency}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-utility">License / cert # (optional)</span>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="t-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-utility">Issued date</span>
          <input
            type="date"
            value={issuedDate}
            onChange={(e) => onIssuedChange(e.target.value)}
            className="t-input"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="t-utility">Expiry date</span>
          <input
            type="date"
            value={expiresDate}
            onChange={(e) => setExpiresDate(e.target.value)}
            className="t-input"
          />
        </label>
        {error ? (
          <div className="sm:col-span-2 border-2 border-[var(--color-mark)] bg-[var(--color-mark)] px-3 py-2">
            <div className="t-utility" style={{ color: "var(--color-field)" }}>
              Error
            </div>
            <p
              className="text-[13px] mt-1"
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
            {submitting ? "Adding…" : "Add credential →"}
          </Button>
        </div>
      </form>
    </section>
  );
}
