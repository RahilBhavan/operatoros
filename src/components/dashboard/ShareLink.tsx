"use client";

import { useState } from "react";
import { Button } from "@/components/doctrine/Button";

interface Props {
  canShare: boolean;
}

export default function ShareLink({ canShare }: Props) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/share", { method: "POST" });
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
              Live, read-only snapshot of your compliance calendar.
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
          </>
        ) : (
          <>
            <p
              className="text-[14px]"
              style={{ fontFamily: "var(--font-index)" }}
            >
              Generate a read-only URL anyone can open without an account.
            </p>
            <div>
              <Button
                variant="ground"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? "Generating…" : "Generate link →"}
              </Button>
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
