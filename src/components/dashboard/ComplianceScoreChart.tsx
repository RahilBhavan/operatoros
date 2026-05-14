"use client";

interface ScorePoint {
  score: number;
  recorded_at: string;
}

interface Props {
  history: ScorePoint[];
  currentScore: number;
}

const WIDTH = 400;
const HEIGHT = 80;
const PADDING = { top: 8, bottom: 8, left: 4, right: 4 };

export default function ComplianceScoreChart({ history, currentScore }: Props) {
  if (history.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm text-slate-500 mb-1">Score Trend (90 days)</p>
        <p className="text-xs text-slate-400 mt-2">
          Trend data builds up over time as daily snapshots are recorded.
        </p>
      </div>
    );
  }

  const scores = history.map((p) => p.score);
  const minScore = Math.max(0, Math.min(...scores) - 5);
  const maxScore = Math.min(100, Math.max(...scores) + 5);
  const range = maxScore - minScore || 1;

  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;

  function toX(index: number) {
    return PADDING.left + (index / (history.length - 1)) * chartWidth;
  }

  function toY(score: number) {
    return PADDING.top + chartHeight - ((score - minScore) / range) * chartHeight;
  }

  const points = history.map((p, i) => `${toX(i)},${toY(p.score)}`).join(" ");
  const areaPoints = [
    `${PADDING.left},${PADDING.top + chartHeight}`,
    ...history.map((p, i) => `${toX(i)},${toY(p.score)}`),
    `${WIDTH - PADDING.right},${PADDING.top + chartHeight}`,
  ].join(" ");

  const strokeColor =
    currentScore >= 80 ? "#16a34a" : currentScore >= 60 ? "#ca8a04" : "#dc2626";
  const fillColor =
    currentScore >= 80 ? "#f0fdf4" : currentScore >= 60 ? "#fefce8" : "#fef2f2";

  const first = history[0];
  const last = history[history.length - 1];
  const delta = last.score - first.score;
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;
  const deltaColor =
    delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-slate-400";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">Score Trend (90 days)</p>
        {delta !== 0 && (
          <span className={`text-xs font-semibold ${deltaColor}`}>
            {deltaLabel} pts
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: HEIGHT }}
        aria-label={`Compliance score trend over 90 days`}
      >
        <polygon points={areaPoints} fill={fillColor} opacity={0.6} />
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Last point dot */}
        <circle
          cx={toX(history.length - 1)}
          cy={toY(last.score)}
          r={3}
          fill={strokeColor}
        />
      </svg>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>
          {new Date(first.recorded_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>Today</span>
      </div>
    </div>
  );
}
