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
const HEIGHT = 90;
const PADDING = { top: 8, bottom: 8, left: 4, right: 4 };

export default function ComplianceScoreChart({
  history,
  currentScore,
}: Props) {
  if (history.length < 2) {
    return (
      <div className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-4 py-2 flex items-center justify-between">
          <span
            className="t-utility"
            style={{ color: "var(--color-field)" }}
          >
            Score trend · 90 days
          </span>
          <span
            className="t-utility"
            style={{ color: "var(--color-field)" }}
          >
            PA-SCR
          </span>
        </div>
        <div className="bg-[var(--color-field)] px-4 py-3">
          <p
            className="text-[14px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            Trend data builds up over time as daily snapshots are recorded.
          </p>
        </div>
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

  const isWarning = currentScore < 80;
  const strokeColor = isWarning ? "var(--color-mark)" : "var(--color-ground)";

  const first = history[0];
  const last = history[history.length - 1];
  const delta = last.score - first.score;
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="border-2 border-[var(--color-ground)]">
      <div className="panel-ink px-4 py-2 flex items-center justify-between">
        <span
          className="t-utility"
          style={{ color: "var(--color-field)" }}
        >
          Score trend · 90 days
        </span>
        {delta !== 0 ? (
          <span
            className="font-bold tabular-nums"
            style={{
              fontFamily: "var(--font-index)",
              color: isWarning ? "var(--color-mark)" : "var(--color-field)",
              fontSize: 15,
            }}
          >
            {deltaLabel} pts
          </span>
        ) : null}
      </div>

      <div className="bg-[var(--color-field)] px-4 py-3">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full block"
          style={{ height: HEIGHT }}
          aria-label="Compliance score trend over 90 days"
        >
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={PADDING.top}
            y2={PADDING.top}
            stroke="var(--color-ground)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={PADDING.top + chartHeight}
            y2={PADDING.top + chartHeight}
            stroke="var(--color-ground)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
          <rect
            x={toX(history.length - 1) - 3}
            y={toY(last.score) - 3}
            width={6}
            height={6}
            fill={strokeColor}
          />
        </svg>

        <div className="flex justify-between mt-2 t-utility text-[var(--color-ground)]">
          <span>
            {new Date(first.recorded_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
