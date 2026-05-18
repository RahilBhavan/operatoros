"use client";

import { useState } from "react";
import { StampChip } from "@/components/doctrine/StampChip";

interface Insight {
  title: string;
  body: string;
  urgency: "high" | "medium" | "low";
}

const URGENCY_LABEL: Record<Insight["urgency"], string> = {
  high: "High urgency",
  medium: "Medium",
  low: "Low",
};

export default function ProactiveInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (loaded) return;
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
  }

  return (
    <div className="border-2 border-[var(--color-ground)]">
      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="panel-ink px-5 py-3 flex items-center justify-between w-full text-left group disabled:cursor-not-allowed"
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
          {loaded ? "↺ Refresh" : loading ? "Loading…" : "Run →"}
        </span>
      </button>

      <div className="bg-[var(--color-field)] px-5 py-5">
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
            <ul className="flex flex-col gap-3">
              {insights.map((insight, i) => {
                const isHigh = insight.urgency === "high";
                const accent = isHigh
                  ? "var(--color-mark)"
                  : "var(--color-ground)";
                return (
                  <li
                    key={i}
                    className="border-l-4 border-[var(--color-ground)] pl-4"
                    style={{ borderLeftColor: accent }}
                  >
                    <div
                      className="t-utility"
                      style={{ color: accent }}
                    >
                      {URGENCY_LABEL[insight.urgency]} · {insight.title}
                    </div>
                    <p
                      className="mt-1 text-[14px] leading-relaxed"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {insight.body}
                    </p>
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
