"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { Utility, Index, Caption, Body } from "@/components/doctrine";

interface Insight {
  title: string;
  body: string;
  urgency: "high" | "medium" | "low";
}

const URGENCY_CONFIG = {
  high: {
    letter: "A",
    icon: AlertTriangle,
    accent: "var(--color-mark)",
  },
  medium: {
    letter: "B",
    icon: Info,
    accent: "var(--color-ground)",
  },
  low: {
    letter: "C",
    icon: Info,
    accent: "var(--color-ground)",
  },
} as const;

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
        className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between w-full group disabled:opacity-70"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-field)]" />
          <Utility className="!text-[var(--color-field)] !opacity-100">
            AI COMPLIANCE INSIGHTS
          </Utility>
          {!loaded && (
            <span className="border-2 border-[var(--color-field)] px-2 py-0.5 t-utility !text-[12px] !text-[var(--color-field)] !opacity-100">
              NEW
            </span>
          )}
        </span>
        <span className="flex items-center gap-3">
          <Index className="!text-[var(--color-field)] !text-[12px] opacity-80">
            PA-AI
          </Index>
          {!loaded && (
            <ChevronDown className="w-4 h-4 text-[var(--color-field)] transition-transform group-hover:translate-y-0.5" />
          )}
        </span>
      </button>

      <div className="bg-[var(--color-field)] px-5 py-5">
        {loading && (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 border-2 border-[var(--color-ground)] border-t-transparent animate-spin"
              aria-hidden
            />
            <Caption>Analyzing your compliance posture…</Caption>
          </div>
        )}

        {!loading && !loaded && (
          <Caption>
            Click to surface action items and risks from your active deadlines.
          </Caption>
        )}

        {error === "upgrade" && (
          <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-4 py-3">
            <Utility className="!text-[12px]">PAID PLAN REQUIRED</Utility>
            <Body className="mt-1">
              AI compliance insights are available on the Business ($79/mo) and
              Accountant ($299/mo) plans.{" "}
              <a
                href="/billing"
                className="t-link text-[var(--color-mark)] underline"
              >
                Upgrade to unlock.
              </a>
            </Body>
          </div>
        )}

        {error && error !== "upgrade" && (
          <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-3 py-2">
            <Utility className="!text-[var(--color-field)] !opacity-100 !text-[12px]">
              ERROR
            </Utility>
            <p className="t-caption !text-[var(--color-field)] mt-1">{error}</p>
          </div>
        )}

        {loaded && insights.length === 0 && !error && (
          <Caption>
            No additional insights at this time — your compliance posture looks
            solid.
          </Caption>
        )}

        {insights.length > 0 && (
          <div className="mt-1 mb-3 border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-3 py-2">
            <Utility className="!text-[var(--color-field)] !opacity-100 !text-[12px]">
              ADVISORY
            </Utility>
            <p className="t-caption !text-[var(--color-field)] mt-1">
              AI-generated suggestions — always verify with your accountant or
              the relevant agency before acting.
            </p>
          </div>
        )}

        {insights.length > 0 && (
          <ul className="flex flex-col gap-2">
            {insights.map((insight, i) => {
              const config =
                URGENCY_CONFIG[insight.urgency] ?? URGENCY_CONFIG.low;
              const Icon = config.icon;
              const isHigh = insight.urgency === "high";
              return (
                <li
                  key={i}
                  className="flex items-stretch gap-3 bg-[var(--color-field)] border-l-2"
                  style={{ borderLeftColor: config.accent }}
                >
                  {/* Sort-symbol letter box */}
                  <span
                    className="flex items-center justify-center w-10 shrink-0 border-2"
                    style={{
                      borderColor: config.accent,
                      color: config.accent,
                    }}
                  >
                    <span className="t-h3 leading-none">{config.letter}</span>
                  </span>

                  <div className="flex items-start gap-2 py-2 pr-2 flex-1 min-w-0">
                    <Icon
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: config.accent }}
                    />
                    <div className="min-w-0">
                      <div
                        className="t-utility !text-[12px]"
                        style={{ color: config.accent, opacity: 1 }}
                      >
                        {isHigh ? "HIGH URGENCY · " : insight.urgency === "medium" ? "MEDIUM · " : "LOW · "}
                        {insight.title}
                      </div>
                      <Body className="!text-[13px] mt-0.5">
                        {insight.body}
                      </Body>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
