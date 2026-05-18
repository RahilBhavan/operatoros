"use client";

import { useState } from "react";
import { Button } from "@/components/doctrine/Button";
import { FormField } from "@/components/doctrine/FormField";
import { StampChip } from "@/components/doctrine/StampChip";

interface Props {
  canInvite: boolean;
}

export default function AccountantInvite({ canInvite }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/accountant/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountant_email: email, accountant_name: name }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send invite");
      return;
    }

    const appUrl = window.location.origin;
    setPortalUrl(`${appUrl}/accountant/${data.token}`);
    setEmail("");
    setName("");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-2 border-[var(--color-ground)] flex flex-col">
      <div className="panel-ink px-5 py-3 flex items-center justify-between">
        <span
          className="t-utility"
          style={{ color: "var(--color-field)" }}
        >
          Accountant portal
        </span>
        <span
          className="t-utility"
          style={{ color: "var(--color-field)" }}
        >
          PA-ACC
        </span>
      </div>

      <div className="bg-[var(--color-field)] px-5 py-5 flex-1 flex flex-col gap-4">
        {!canInvite ? (
          <>
            <p
              className="text-[14px] leading-relaxed"
              style={{ fontFamily: "var(--font-index)" }}
            >
              Give your accountant or CPA a live, read-only view of your
              compliance calendar — no login required.
            </p>
            <a
              href="/billing"
              className="t-utility text-[var(--color-mark)] underline underline-offset-4"
            >
              Upgrade to enable →
            </a>
          </>
        ) : portalUrl ? (
          <>
            <StampChip tone="ground">Invite sent</StampChip>
            <p
              className="text-[14px]"
              style={{ fontFamily: "var(--font-index)" }}
            >
              Share this link with your accountant.
            </p>
            <div className="flex items-center gap-2">
              <input
                value={portalUrl}
                readOnly
                className="t-input flex-1 min-w-0 !text-[12px]"
                style={{ fontFamily: "var(--font-index)" }}
              />
              <Button variant="ground" onClick={copyLink} className="shrink-0">
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setPortalUrl("")}
              className="t-utility text-[var(--color-mark)] underline underline-offset-4 text-left"
            >
              Invite another accountant →
            </button>
          </>
        ) : (
          <form onSubmit={handleInvite} className="flex flex-col gap-4">
            <FormField label="Name (optional)" htmlFor="acc-name">
              <input
                id="acc-name"
                type="text"
                placeholder="Accountant name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="t-input"
              />
            </FormField>
            <FormField label="Email" htmlFor="acc-email">
              <div className="flex gap-2">
                <input
                  id="acc-email"
                  type="email"
                  placeholder="accountant@firm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="t-input flex-1 min-w-0"
                />
                <Button
                  variant="mark"
                  type="submit"
                  disabled={loading || !email}
                  className="shrink-0"
                >
                  {loading ? "Sending…" : "Invite"}
                </Button>
              </div>
            </FormField>
            {error ? (
              <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] px-3 py-2">
                <div
                  className="t-utility"
                  style={{ color: "var(--color-field)" }}
                >
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
            <p
              className="text-[13px] leading-relaxed"
              style={{ fontFamily: "var(--font-index)" }}
            >
              Your accountant gets a read-only view of your compliance calendar —
              no login required. CPAs managing multiple clients can see all their
              clients in one portfolio view.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
