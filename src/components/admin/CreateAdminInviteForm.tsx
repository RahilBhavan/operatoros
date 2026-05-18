"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Body, Button, Caption, Utility } from "@/components/doctrine";

export default function CreateAdminInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAcceptUrl(null);
    setBusy(true);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to create invite");
      return;
    }
    const data = (await res.json()) as { accept_url: string };
    setAcceptUrl(`${window.location.origin}${data.accept_url}`);
    setEmail("");
    router.refresh();
  }

  async function copy() {
    if (!acceptUrl) return;
    try {
      await navigator.clipboard.writeText(acceptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-[var(--color-ground)] bg-[var(--color-field)]"
    >
      <div className="border-b-2 border-[var(--color-ground)] px-5 py-3">
        <Utility>INVITE NEW PLATFORM ADMIN</Utility>
      </div>
      <div className="px-5 py-4">
        <Caption className="mb-4">
          Generates a one-time invite token valid for 7 days. The recipient must
          already have a regular OperatorOS account (or sign up with this email),
          then visit the link below to be elevated.
        </Caption>
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <label className="flex-1 flex flex-col gap-1 w-full">
            <Utility className="!text-[12px]">EMAIL</Utility>
            <input
              type="email"
              required
              placeholder="cofounder@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className="t-input"
            />
          </label>
          <Button type="submit" disabled={busy || !email} variant="ground">
            {busy ? "CREATING…" : "GENERATE INVITE →"}
          </Button>
        </div>

        {error && (
          <div className="mt-3 border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-3 py-2">
            <Caption className="!text-[var(--color-field)] !opacity-100">
              {error}
            </Caption>
          </div>
        )}

        {acceptUrl && (
          <div className="mt-4 border-2 border-[var(--color-ground)] bg-[var(--color-field)]">
            <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-3 py-2">
              <Utility className="!text-[var(--color-field)]">
                INVITE READY · SHARE THIS LINK
              </Utility>
            </div>
            <div className="px-3 py-3 flex gap-2 items-center">
              <Body className="flex-1 !text-[12px] font-mono truncate border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-3 py-2">
                {acceptUrl}
              </Body>
              <button
                type="button"
                onClick={copy}
                className="btn btn-mark"
              >
                {copied ? "COPIED ✓" : "COPY"}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
