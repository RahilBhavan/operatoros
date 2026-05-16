"use client";

import { useState } from "react";
import { Users, Copy, Check, ExternalLink } from "lucide-react";
import { Utility, Index, Caption, Body, Button } from "@/components/doctrine";

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
    <div className="border-2 border-[var(--color-ground)]">
      <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--color-field)]" />
          <Utility className="!text-[var(--color-field)] !opacity-100">
            ACCOUNTANT PORTAL
          </Utility>
        </div>
        <Index className="!text-[var(--color-field)] !text-[12px] opacity-80">
          PA-ACC
        </Index>
      </div>

      <div className="bg-[var(--color-field)] px-5 py-5">
        {!canInvite ? (
          <div className="flex flex-col gap-3">
            <Body>
              Give your accountant or CPA a live, read-only view of your
              compliance calendar — no login required.
            </Body>
            <Caption>
              CPAs managing multiple clients can see all their clients&apos;
              compliance scores in one portfolio view.
            </Caption>
            <div>
              <a
                href="/billing"
                className="t-link t-utility !text-[12px] text-[var(--color-mark)]"
              >
                UPGRADE TO ENABLE →
              </a>
            </div>
          </div>
        ) : portalUrl ? (
          <div className="flex flex-col gap-3">
            <div className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] px-3 py-2">
              <Utility className="!text-[var(--color-field)] !opacity-100 !text-[12px]">
                INVITE SENT
              </Utility>
              <p className="t-caption !text-[var(--color-field)] mt-1">
                Share this link with your accountant.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={portalUrl}
                readOnly
                className="t-input flex-1 min-w-0 font-mono text-xs"
              />
              <Button
                variant="ground"
                onClick={copyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[var(--color-field)]" />
                ) : (
                  <Copy className="w-4 h-4 text-[var(--color-field)]" />
                )}
                <span>{copied ? "COPIED" : "COPY"}</span>
              </Button>
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost shrink-0"
                aria-label="Open portal in new tab"
              >
                <ExternalLink className="w-4 h-4 text-[var(--color-ground)]" />
              </a>
            </div>
            <button
              type="button"
              onClick={() => setPortalUrl("")}
              className="t-link t-utility !text-[12px] text-left text-[var(--color-mark)]"
            >
              INVITE ANOTHER ACCOUNTANT →
            </button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Utility className="!text-[12px]">NAME (OPTIONAL)</Utility>
              <input
                type="text"
                placeholder="Accountant name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="t-input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Utility className="!text-[12px]">EMAIL</Utility>
              <div className="flex gap-2">
                <input
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
                  {loading ? "SENDING…" : "INVITE"}
                </Button>
              </div>
            </div>
            {error && (
              <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-3 py-2">
                <Utility className="!text-[var(--color-field)] !opacity-100 !text-[12px]">
                  ERROR
                </Utility>
                <p className="t-caption !text-[var(--color-field)] mt-1">
                  {error}
                </p>
              </div>
            )}
            <Caption>
              Your accountant gets a read-only view of your compliance calendar
              — no login required. CPAs managing multiple clients can see all
              their clients in one portfolio view.
            </Caption>
          </form>
        )}
      </div>
    </div>
  );
}
