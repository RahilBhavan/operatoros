"use client";

import { useState } from "react";
import { StampChip } from "@/components/doctrine/StampChip";
import { useToast } from "@/components/doctrine/Toast";

interface Insight {
  title: string;
  body: string;
  urgency: "high" | "medium" | "low";
  source_url?: string;
  agency?: string;
}

const URGENCY_LABEL: Record<Insight["urgency"], string> = {
  high: "High urgency",
  medium: "Medium",
  low: "Low",
};

function formatRefreshed(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export default function ProactiveInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [sharingIndex, setSharingIndex] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<
    { index: number; ok: boolean; message: string } | null
  >(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/ai/compliance-insights", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    setLoaded(true);

    if (res.status === 403 && data.upgradeRequired) {
      setError("upgrade");
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "Failed to load insights");
      return;
    }

    setInsights(data.insights ?? []);
    setGeneratedAt(data.generated_at ?? null);
  }

  async function shareWithAccountant(insight: Insight, idx: number) {
    setSharingIndex(idx);
    setShareStatus(null);
    try {
      const res = await fetch("/api/ai/share-with-accountant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: insight.title,
          body: insight.body,
          agency: insight.agency,
          source_url: insight.source_url,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShareStatus({
          index: idx,
          ok: true,
          message: `Sent to ${data.sent_to}`,
        });
        toast.success("Shared with accountant", `${insight.title} sent to ${data.sent_to}`);
      } else {
        setShareStatus({
          index: idx,
          ok: false,
          message: data.error ?? "Failed to send.",
        });
        toast.error("Share failed", data.error ?? "Please try again.");
      }
    } catch {
      setShareStatus({
        index: idx,
        ok: false,
        message: "Network error.",
      });
      toast.error("Network error", "Please try again.");
    } finally {
      setSharingIndex(null);
    }
  }

  return (
    <div className="border-2 border-[var(--color-ground)]">
      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="panel-ink px-4 py-2 flex items-center justify-between w-full text-left group disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-3">
          <span
            className="t-utility"
            style={{ color: "var(--color-field)" }}
          >
            Compliance intelligence
          </span>
          {!loaded ? <StampChip tone="mark">New</StampChip> : null}
        </span>
        <span
          className="t-utility"
          style={{ color: "var(--color-field)" }}
        >
          {loaded && generatedAt
            ? `↺ Refresh · ${formatRefreshed(generatedAt)}`
            : loaded
            ? "↺ Refresh"
            : loading
            ? "Loading…"
            : "Run →"}
        </span>
      </button>

      <div className="bg-[var(--color-field)] px-4 py-4">
        {loading ? (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-block w-3 h-3 bg-[var(--color-mark)] motion-safe:animate-pulse"
            />
            <span className="t-utility text-[var(--color-ground)]">
              Analysing compliance posture…
            </span>
          </div>
        ) : null}

        {!loading && !loaded ? (
          <p
            className="text-[14px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            Click <b>Run</b> to surface action items and risks from your active
            deadlines.
          </p>
        ) : null}

        {error === "upgrade" ? (
          <div className="border-2 border-[var(--color-ground)] p-4">
            <div className="t-utility mb-2">Paid plan required</div>
            <p
              className="text-[14px]"
              style={{ fontFamily: "var(--font-index)" }}
            >
              AI insights are available on Business ($79/mo) and Accountant
              ($299/mo).{" "}
              <a href="/billing" className="t-link text-[var(--color-mark)]">
                Upgrade to unlock →
              </a>
            </p>
          </div>
        ) : null}

        {error && error !== "upgrade" ? (
          <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-3 py-2">
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

        {loaded && insights.length === 0 && !error ? (
          <p
            className="text-[14px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            No additional insights — your compliance posture looks solid.
          </p>
        ) : null}

        {insights.length > 0 ? (
          <>
            <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-3 py-2 mb-3">
              <div
                className="t-utility"
                style={{ color: "var(--color-field)" }}
              >
                Advisory
              </div>
              <p
                className="text-[13px] mt-1"
                style={{
                  fontFamily: "var(--font-index)",
                  color: "var(--color-field)",
                }}
              >
                AI-generated. Verify with your accountant or the agency before
                acting.
              </p>
            </div>
            <ul className="flex flex-col gap-4">
              {insights.map((insight, i) => {
                const isHigh = insight.urgency === "high";
                const accent = isHigh
                  ? "var(--color-mark)"
                  : "var(--color-ground)";
                const status = shareStatus?.index === i ? shareStatus : null;
                return (
                  <li
                    key={i}
                    className="border-l-4 border-[var(--color-ground)] pl-4"
                    style={{ borderLeftColor: accent }}
                  >
                    {/* Agency leads — visual anchor per WS-1.4. */}
                    {insight.agency ? (
                      <div
                        className="t-utility"
                        style={{ color: accent }}
                      >
                        {insight.agency} · {URGENCY_LABEL[insight.urgency]}
                      </div>
                    ) : (
                      <div
                        className="t-utility"
                        style={{ color: accent }}
                      >
                        {URGENCY_LABEL[insight.urgency]}
                      </div>
                    )}
                    <div
                      className="mt-1 font-bold text-[15px]"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {insight.title}
                    </div>
                    <p
                      className="mt-1 text-[14px] leading-relaxed"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {insight.body}
                    </p>
                    {insight.source_url ? (
                      <div className="mt-2">
                        <a
                          href={insight.source_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="t-utility text-[var(--color-mark)] underline underline-offset-4"
                        >
                          Source →
                        </a>
                      </div>
                    ) : null}
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => shareWithAccountant(insight, i)}
                        disabled={sharingIndex === i}
                        className="t-utility text-[var(--color-ground)] hover:text-[var(--color-mark)] disabled:cursor-not-allowed"
                      >
                        {sharingIndex === i
                          ? "Sending…"
                          : "→ Share with my accountant"}
                      </button>
                      {status ? (
                        <span
                          className="t-utility"
                          style={{
                            color: status.ok
                              ? "var(--color-mark)"
                              : "var(--color-ground)",
                          }}
                        >
                          {status.message}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
