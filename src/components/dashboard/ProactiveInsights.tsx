"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, Info, ChevronDown } from "lucide-react";

interface Insight {
  title: string;
  body: string;
  urgency: "high" | "medium" | "low";
}

const URGENCY_CONFIG = {
  high: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle },
  medium: { color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", icon: Info },
  low: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: Info },
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
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <button
        onClick={load}
        disabled={loading}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700">AI Compliance Insights</span>
          {!loaded && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              New
            </span>
          )}
        </div>
        {!loaded && (
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        )}
      </button>

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Analyzing your compliance posture…
        </div>
      )}

      {error === "upgrade" && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-700 mb-0.5">Growth or Scale plan required</p>
          <p className="text-xs text-blue-600">
            AI compliance insights are available on Growth ($79/mo) and Scale ($149/mo) plans.{" "}
            <a href="/billing" className="underline font-medium">Upgrade to unlock.</a>
          </p>
        </div>
      )}

      {error && error !== "upgrade" && (
        <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {loaded && insights.length === 0 && !error && (
        <p className="mt-3 text-xs text-slate-400">
          No additional insights at this time — your compliance posture looks solid.
        </p>
      )}

      {insights.length > 0 && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
          AI-generated suggestions — always verify with your accountant or the relevant agency before acting.
        </p>
      )}

      {insights.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {insights.map((insight, i) => {
            const config = URGENCY_CONFIG[insight.urgency] ?? URGENCY_CONFIG.low;
            const Icon = config.icon;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl border ${config.border} ${config.bg}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
                <div>
                  <div className={`text-xs font-semibold ${config.color}`}>{insight.title}</div>
                  <div className={`text-xs mt-0.5 ${config.color} opacity-80`}>{insight.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
