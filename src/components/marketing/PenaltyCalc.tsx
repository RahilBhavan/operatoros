"use client";

import { useMemo, useState } from "react";

function formatUSD(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const PENALTY_RATE = 0.1;
const ANNUAL_SUBSCRIPTION = 79 * 12;

export function PenaltyCalc() {
  const [deposit, setDeposit] = useState(20000);
  const [statesCount, setStatesCount] = useState(2);

  const perMiss = deposit * PENALTY_RATE;
  const stateMultiplier = useMemo(() => {
    if (statesCount <= 1) return 1;
    if (statesCount === 2) return 1.6;
    if (statesCount === 3) return 2.1;
    return 2.6;
  }, [statesCount]);
  const annualExposure = Math.round(perMiss * stateMultiplier);
  const ratio = annualExposure / ANNUAL_SUBSCRIPTION;

  return (
    <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-6 sm:p-8">
      <div className="flex items-baseline justify-between mb-6">
        <p className="t-utility text-[var(--color-ground)] opacity-70">
          Penalty cost — back of envelope
        </p>
        <p className="t-utility text-[var(--color-mark)]">IRC §6656</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="penaltycalc-deposit"
            className="t-utility text-[var(--color-ground)] opacity-70"
          >
            Quarterly payroll deposit (USD)
          </label>
          <input
            id="penaltycalc-deposit"
            type="number"
            min={1000}
            step={1000}
            value={deposit}
            onChange={(e) =>
              setDeposit(Math.max(0, Number.parseInt(e.target.value || "0", 10)))
            }
            className="t-input"
            inputMode="numeric"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="penaltycalc-states"
            className="t-utility text-[var(--color-ground)] opacity-70"
          >
            States you operate in
          </label>
          <select
            id="penaltycalc-states"
            value={statesCount}
            onChange={(e) =>
              setStatesCount(Number.parseInt(e.target.value, 10))
            }
            className="t-input"
          >
            <option value={1}>1 state</option>
            <option value={2}>2 states</option>
            <option value={3}>3 states</option>
            <option value={4}>4+ states</option>
          </select>
        </div>
      </div>

      <div className="border-t-2 border-[var(--color-ground)] pt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="t-utility text-[var(--color-ground)] opacity-70 mb-2">
            Annualized exposure on a single missed quarter
          </p>
          <p className="t-display !text-[48px] sm:!text-[60px] !leading-none text-[var(--color-mark)] font-black">
            {formatUSD(annualExposure)}
          </p>
        </div>
        <p className="text-[15px] text-[var(--color-ground)] leading-relaxed max-w-xs">
          OperatorOS is <span className="font-bold">$79/mo</span>. One avoided
          miss covers{" "}
          <span className="font-bold">
            ~{Math.max(1, Math.round(ratio * 12))} months
          </span>{" "}
          of subscription.
        </p>
      </div>

      <p className="mt-4 text-[12px] text-[var(--color-ground)]/60 leading-relaxed">
        Illustrative — uses the 10% IRC §6656 failure-to-deposit rate (16+ day
        delinquency) scaled by typical multi-state filing overhead. Verify your
        actual exposure with your accountant.
      </p>
    </div>
  );
}
