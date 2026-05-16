"use client";

import { Utility, Index, Caption } from "@/components/doctrine";

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
      <div className="border-2 border-[var(--color-ground)]">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between">
          <Utility className="!text-[var(--color-field)] !opacity-100">
            SCORE TREND · 90 DAYS
          </Utility>
          <Index className="!text-[var(--color-field)] !text-[12px] opacity-80">
            PA-SCR
          </Index>
        </div>
        <div className="bg-[var(--color-field)] px-5 py-5">
          <Caption>
            Trend data builds up over time as daily snapshots are recorded.
          </Caption>
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
  const areaPoints = [
    `${PADDING.left},${PADDING.top + chartHeight}`,
    ...history.map((p, i) => `${toX(i)},${toY(p.score)}`),
    `${WIDTH - PADDING.right},${PADDING.top + chartHeight}`,
  ].join(" ");

  // Doctrine: navy when healthy (>=80), red Mark when warning (<80). No traffic lights.
  const isWarning = currentScore < 80;
  const strokeColor = isWarning ? "var(--color-mark)" : "var(--color-ground)";

  const first = history[0];
  const last = history[history.length - 1];
  const delta = last.score - first.score;
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="border-2 border-[var(--color-ground)]">
      <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between">
        <Utility className="!text-[var(--color-field)] !opacity-100">
          SCORE TREND · 90 DAYS
        </Utility>
        {delta !== 0 && (
          <Index className="!text-[var(--color-field)] !text-[15px]">
            {deltaLabel} PTS
          </Index>
        )}
      </div>

      <div className="bg-[var(--color-field)] px-5 py-5">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full block"
          style={{ height: HEIGHT }}
          aria-label="Compliance score trend over 90 days"
        >
          {/* Min/max gridlines */}
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={PADDING.top}
            y2={PADDING.top}
            stroke="var(--color-ground)"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={PADDING.top + chartHeight}
            y2={PADDING.top + chartHeight}
            stroke="var(--color-ground)"
            strokeOpacity={0.15}
            strokeWidth={1}
          />

          {/* Area under curve at 12% opacity of the stroke color */}
          <polygon points={areaPoints} fill={strokeColor} fillOpacity={0.12} />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinejoin="miter"
            strokeLinecap="square"
          />

          {/* Last-point marker — sharp square, not round */}
          <rect
            x={toX(history.length - 1) - 3}
            y={toY(last.score) - 3}
            width={6}
            height={6}
            fill={strokeColor}
          />
        </svg>

        <div className="flex justify-between mt-2">
          <Caption className="!text-[12px]">
            {new Date(first.recorded_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Caption>
          <Caption className="!text-[12px]">TODAY</Caption>
        </div>
      </div>
    </div>
  );
}
