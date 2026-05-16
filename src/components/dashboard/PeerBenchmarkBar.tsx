"use client";

import { Utility, Index, Caption, Body } from "@/components/doctrine";
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
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between">
          <Utility className="!text-[var(--color-field)] !opacity-100">
            PEER BENCHMARK · COHORT
          </Utility>
          <Index className="!text-[var(--color-field)] !text-[12px] opacity-80">
            PA-PEER
          </Index>
        </div>
        <div className="bg-[var(--color-field)] px-5 py-5">
          <Caption>{beFirst}</Caption>
        </div>
      </div>
    );
  }

  const chartWidth = WIDTH - LEFT - RIGHT;
  const toX = (n: number) => LEFT + (Math.min(100, Math.max(0, n)) / 100) * chartWidth;

  const cohort = describeCohort(peer.industrySlug, peer.stateCode);
  const isAtOrAboveMedian = peer.userScore >= peer.median;
  const userColor = isAtOrAboveMedian ? "var(--color-ground)" : "var(--color-mark)";

  const ticks = [
    { x: toX(peer.p25), label: "P25", value: peer.p25 },
    { x: toX(peer.median), label: "MED", value: peer.median },
    { x: toX(peer.p75), label: "P75", value: peer.p75 },
    { x: toX(peer.p90), label: "P90", value: peer.p90 },
  ];

  const userX = toX(peer.userScore);

  return (
    <div className="border-2 border-[var(--color-ground)]">
      <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between">
        <Utility className="!text-[var(--color-field)] !opacity-100">
          PEER BENCHMARK · COHORT
        </Utility>
        <Index className="!text-[var(--color-field)] !text-[15px]">
          {peer.percentile}P
        </Index>
      </div>

      <div className="bg-[var(--color-field)] px-5 py-5">
        <Body className="!text-[15px] !mb-3">
          You score{" "}
          <span className="t-h3 inline-block align-baseline">{peer.userScore}</span>{" "}
          —{" "}
          <span
            style={{ color: userColor }}
            className="font-semibold"
          >
            {peer.percentile}th percentile
          </span>{" "}
          vs. {cohort}.
        </Body>

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
            fill="var(--color-field-soft, #f5f1ea)"
            stroke="var(--color-ground)"
            strokeWidth={1}
          />

          {/* Median fill — left half is "below median"; right half is "above median" */}
          <rect
            x={toX(peer.p25)}
            y={BAR_Y}
            width={Math.max(toX(peer.p75) - toX(peer.p25), 0)}
            height={BAR_HEIGHT}
            fill="var(--color-ground)"
            fillOpacity={0.12}
          />

          {/* Tick marks */}
          {ticks.map((t) => (
            <g key={t.label}>
              <line
                x1={t.x}
                x2={t.x}
                y1={BAR_Y}
                y2={BAR_Y + BAR_HEIGHT}
                stroke="var(--color-ground)"
                strokeWidth={1}
                strokeOpacity={0.5}
              />
              <text
                x={t.x}
                y={BAR_Y + BAR_HEIGHT + 14}
                textAnchor="middle"
                className="t-utility"
                fontSize="9"
                fill="var(--color-ground)"
                opacity={0.7}
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* User marker */}
          <rect
            x={userX - 2}
            y={BAR_Y - 5}
            width={4}
            height={BAR_HEIGHT + 10}
            fill={userColor}
          />
          <text
            x={userX}
            y={BAR_Y - 9}
            textAnchor="middle"
            fontSize="10"
            fill={userColor}
            className="t-utility"
            fontWeight="700"
          >
            YOU
          </text>
        </svg>

        <Caption className="!text-[12px] !mt-3">
          BASED ON {peer.cohortSize} {cohort.toUpperCase()} TRACKED ON OPERATOROS · LAST REFRESHED{" "}
          {new Date(peer.lastCapturedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </Caption>
      </div>
    </div>
  );
}
