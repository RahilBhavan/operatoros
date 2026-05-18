"use client";

import type { PeerResult } from "@/lib/benchmarks";
import { describeCohort } from "@/lib/benchmarks";

const WIDTH = 400;
const HEIGHT = 70;
const BAR_Y = 26;
const BAR_HEIGHT = 16;
const LEFT = 8;
const RIGHT = 8;

export default function PeerBenchmarkBar({ peer }: { peer: PeerResult }) {
  if (peer.kind === "empty") {
    const cohort = describeCohort(peer.industrySlug, peer.stateCode);
    const beFirst =
      peer.industrySlug && peer.stateCode
        ? `Be the first ${cohort} on OperatorOS — peer benchmarks unlock at 10 businesses.`
        : "Peer benchmarks compare you to the same industry × state. They unlock once 10 similar businesses are tracked.";

    return (
      <div className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-5 py-3 flex items-center justify-between">
          <span
            className="t-utility"
            style={{ color: "var(--color-field)" }}
          >
            Peer benchmark · cohort
          </span>
          <span
            className="t-utility"
            style={{ color: "var(--color-field)" }}
          >
            PA-PEER
          </span>
        </div>
        <div className="bg-[var(--color-field)] px-5 py-5">
          <p
            className="text-[14px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            {beFirst}
          </p>
        </div>
      </div>
    );
  }

  const chartWidth = WIDTH - LEFT - RIGHT;
  const toX = (n: number) =>
    LEFT + (Math.min(100, Math.max(0, n)) / 100) * chartWidth;

  const cohort = describeCohort(peer.industrySlug, peer.stateCode);
  const isAtOrAboveMedian = peer.userScore >= peer.median;
  const userColor = isAtOrAboveMedian
    ? "var(--color-ground)"
    : "var(--color-mark)";

  const ticks = [
    { x: toX(peer.p25), label: "P25" },
    { x: toX(peer.median), label: "MED" },
    { x: toX(peer.p75), label: "P75" },
    { x: toX(peer.p90), label: "P90" },
  ];

  const userX = toX(peer.userScore);

  return (
    <div className="border-2 border-[var(--color-ground)]">
      <div className="panel-ink px-5 py-3 flex items-center justify-between">
        <span
          className="t-utility"
          style={{ color: "var(--color-field)" }}
        >
          Peer benchmark · cohort
        </span>
        <span
          className="font-bold tabular-nums"
          style={{
            fontFamily: "var(--font-index)",
            color: "var(--color-field)",
            fontSize: 15,
          }}
        >
          {peer.percentile}p
        </span>
      </div>

      <div className="bg-[var(--color-field)] px-5 py-5">
        <p
          className="text-[14px] mb-4"
          style={{ fontFamily: "var(--font-index)" }}
        >
          You score{" "}
          <span
            className="font-black text-[18px]"
            style={{ fontFamily: "var(--font-destination)" }}
          >
            {peer.userScore}
          </span>{" "}
          —{" "}
          <span style={{ color: userColor, fontWeight: 700 }}>
            {peer.percentile}th percentile
          </span>{" "}
          vs. {cohort}.
        </p>

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full block"
          style={{ height: HEIGHT }}
          role="img"
          aria-label={`Your score ${peer.userScore} is at the ${peer.percentile}th percentile of ${cohort}.`}
        >
          {/* Track */}
          <rect
            x={LEFT}
            y={BAR_Y}
            width={chartWidth}
            height={BAR_HEIGHT}
            fill="var(--color-field)"
            stroke="var(--color-ground)"
            strokeWidth={1}
          />

          {/* IQR fill — solid Ink */}
          <rect
            x={toX(peer.p25)}
            y={BAR_Y}
            width={Math.max(toX(peer.p75) - toX(peer.p25), 0)}
            height={BAR_HEIGHT}
            fill="var(--color-ground)"
          />

          {/* Tick marks */}
          {ticks.map((t) => (
            <g key={t.label}>
              <line
                x1={t.x}
                x2={t.x}
                y1={BAR_Y - 2}
                y2={BAR_Y + BAR_HEIGHT + 2}
                stroke="var(--color-ground)"
                strokeWidth={1}
              />
              <text
                x={t.x}
                y={BAR_Y + BAR_HEIGHT + 14}
                textAnchor="middle"
                fontSize="9"
                fill="var(--color-ground)"
                fontFamily="var(--font-destination)"
                fontWeight="700"
                letterSpacing="0.08em"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* User marker */}
          <rect
            x={userX - 2}
            y={BAR_Y - 6}
            width={4}
            height={BAR_HEIGHT + 12}
            fill={userColor}
          />
          <text
            x={userX}
            y={BAR_Y - 9}
            textAnchor="middle"
            fontSize="10"
            fill={userColor}
            fontFamily="var(--font-destination)"
            fontWeight="800"
            letterSpacing="0.12em"
          >
            YOU
          </text>
        </svg>

        <div className="t-utility text-[var(--color-ground)] mt-3">
          Based on {peer.cohortSize} {cohort.toUpperCase()} · last refresh{" "}
          {new Date(peer.lastCapturedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}
