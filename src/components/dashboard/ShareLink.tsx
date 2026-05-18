"use client";

import { useState } from "react";
import { Button } from "@/components/doctrine/Button";

interface Props {
  canShare: boolean;
}

// Pre-canned share templates (WS-0.2). Each template hands the API a
// label + expiry that matches the recipient's typical retention need.
// Document-filter scoping is a UI-side concern handled by the share page
// (out of scope here) — for now the label communicates intent to admins
// and to the recipient who sees it in the share URL header.
type ShareTemplate = {
  id: "insurance" | "auditor" | "gc" | "custom";
  label: string;
  recipient: string;
  expiryDays: number;
  blurb: string;
};

const TEMPLATES: ShareTemplate[] = [
  {
    id: "insurance",
    label: "Insurance carrier · last 12 months",
    recipient: "Insurance carrier",
    expiryDays: 90,
    blurb: "Trailing 12 months of compliance posture for renewal underwriting.",
  },
  {
    id: "auditor",
    label: "Auditor / surveyor · current state + docs",
    recipient: "Auditor / surveyor",
    expiryDays: 30,
    blurb: "Current state of compliance with supporting documents attached.",
  },
  {
    id: "gc",
    label: "General contractor · active certs only",
    recipient: "General contractor",
    expiryDays: 365,
    blurb: "Active certifications only — for COI verification on a jobsite.",
  },
  {
    id: "custom",
    label: "Custom · full read-only snapshot",
    recipient: "Recipient",
    expiryDays: 30,
    blurb: "Generic read-only snapshot of your compliance calendar.",
  },
];

export default function ShareLink({ canShare }: Props) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState<ShareTemplate | null>(null);

  async function handleGenerate(template: ShareTemplate) {
    setLoading(true);
    setError("");
    setActive(template);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: template.label,
          expiry_days: template.expiryDays,
        }),
      });
      const data = await res.json();
      if (data.url) {
        setShareUrl(data.url);
      } else {
        setError(data.error ?? "Failed to generate link.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="border-2 border-[var(--color-ground)] flex flex-col">
      <div className="panel-ink px-5 py-3 flex items-center justify-between">
        <span
          className="t-utility"
          style={{ color: "var(--color-field)" }}
        >
          Share link
        </span>
        <span
          className="t-utility"
          style={{ color: "var(--color-field)" }}
        >
          PA-SHR
        </span>
      </div>

      <div className="bg-[var(--color-field)] px-5 py-5 flex-1 flex flex-col gap-3">
        {!canShare ? (
          <>
            <p
              className="text-[14px]"
              style={{ fontFamily: "var(--font-index)" }}
            >
              Shareable link — paid plan required.
            </p>
            <a
              href="/billing"
              className="t-utility text-[var(--color-mark)] underline underline-offset-4"
            >
              Upgrade to enable →
            </a>
          </>
        ) : shareUrl ? (
          <>
            <p
              className="text-[14px]"
              style={{ fontFamily: "var(--font-index)" }}
            >
              {active?.blurb ?? "Live, read-only snapshot of your compliance calendar."}
            </p>
            <div className="flex items-center gap-2">
              <input
                value={shareUrl}
                readOnly
                className="t-input flex-1 min-w-0 !text-[12px] !font-mono"
                style={{ fontFamily: "var(--font-index)" }}
              />
              <Button variant="ground" onClick={handleCopy} className="shrink-0">
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <button
              type="button"
              onClick={() => {
                setShareUrl(null);
                setActive(null);
              }}
              className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] self-start"
            >
              ← Generate another
            </button>
          </>
        ) : (
          <>
            <p
              className="text-[14px]"
              style={{ fontFamily: "var(--font-index)" }}
            >
              Send a read-only URL to your insurance carrier, auditor, or GC.
              Each template scopes label + expiry to the recipient.
            </p>
            <div className="flex flex-col -mb-[2px]">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleGenerate(t)}
                  disabled={loading}
                  className="text-left border-2 border-[var(--color-ground)] -mb-[2px] px-4 py-3 bg-[var(--color-field)] text-[var(--color-ground)] hover:bg-[var(--color-ground)] hover:text-[var(--color-field)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="font-bold text-[14px]"
                    style={{ fontFamily: "var(--font-index)" }}
                  >
                    {loading && active?.id === t.id
                      ? "Generating…"
                      : t.recipient}
                  </div>
                  <div className="t-utility mt-1" style={{ color: "inherit" }}>
                    {t.blurb} · {t.expiryDays}d expiry
                  </div>
                </button>
              ))}
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}
