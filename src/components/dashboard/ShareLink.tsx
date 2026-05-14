"use client";

import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";

interface Props {
  canShare: boolean;
}

export default function ShareLink({ canShare }: Props) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const res = await fetch("/api/share", { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (data.url) setShareUrl(data.url);
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!canShare) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link2 className="w-4 h-4" />
        <span>Shareable link — Growth plan required</span>
      </div>
    );
  }

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={shareUrl}
          readOnly
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-mono min-w-0"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
    >
      <Link2 className="w-4 h-4" />
      {loading ? "Generating…" : "Generate shareable link"}
    </button>
  );
}
