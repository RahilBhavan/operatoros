"use client";

import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { Utility, Index, Caption, Button } from "@/components/doctrine";

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
      // Clipboard permission denied — silently ignore, URL is visible in input
    }
  }

  return (
    <div className="border-2 border-[var(--color-ground)]">
      <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[var(--color-field)]" />
          <Utility className="!text-[var(--color-field)] !opacity-100">
            SHARE LINK
          </Utility>
        </div>
        <Index className="!text-[var(--color-field)] !text-[12px] opacity-80">
          PA-SHR
        </Index>
      </div>

      <div className="bg-[var(--color-field)] px-5 py-5">
        {!canShare ? (
          <div className="flex flex-col gap-2">
            <Caption>
              Shareable link — paid plan required.
            </Caption>
            <a
              href="/billing"
              className="t-link t-utility !text-[12px] text-[var(--color-mark)]"
            >
              UPGRADE TO ENABLE →
            </a>
          </div>
        ) : shareUrl ? (
          <div className="flex flex-col gap-3">
            <Caption>
              Live, read-only snapshot of your compliance calendar.
            </Caption>
            <div className="flex items-center gap-2">
              <input
                value={shareUrl}
                readOnly
                className="t-input flex-1 min-w-0 font-mono text-xs"
              />
              <Button
                variant="ground"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[var(--color-field)]" />
                ) : (
                  <Copy className="w-4 h-4 text-[var(--color-field)]" />
                )}
                <span>{copied ? "COPIED" : "COPY"}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Caption>
              Generate a read-only URL anyone can open without an account.
            </Caption>
            <div>
              <Button
                variant="ground"
                onClick={handleGenerate}
                disabled={loading}
              >
                <Link2 className="w-4 h-4 text-[var(--color-field)]" />
                <span>{loading ? "GENERATING…" : "GENERATE LINK"}</span>
              </Button>
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
          </div>
        )}
      </div>
    </div>
  );
}
