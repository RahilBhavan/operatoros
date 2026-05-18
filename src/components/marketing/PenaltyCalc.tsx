"use client";

import { useMemo, useState } from "react";
import { FormField } from "@/components/doctrine/FormField";
import { StampChip } from "@/components/doctrine/StampChip";

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
      <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-[var(--color-ground)]">
        <span className="t-utility text-[var(--color-ground)]">
          Penalty cost · back of envelope
        </span>
        <StampChip tone="mark">IRC §6656</StampChip>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <FormField label="Quarterly payroll deposit (USD)" htmlFor="penaltycalc-deposit">
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
        </FormField>
        <FormField label="States you operate in" htmlFor="penaltycalc-states">
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
        </FormField>
      </div>

      <div className="border-t-4 border-[var(--color-ground)] pt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <div className="t-utility text-[var(--color-ground)] mb-3">
            Annualised exposure · single missed quarter
          </div>
          <div
            className="font-black leading-none"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 900,
              fontSize: 64,
              letterSpacing: "-0.02em",
              color: "var(--color-mark)",
            }}
          >
            {formatUSD(annualExposure)}
          </div>
        </div>
        <p
          className="text-[15px] leading-relaxed max-w-[280px]"
          style={{ fontFamily: "var(--font-index)" }}
        >
          OperatorOS is <span className="font-bold">$79/mo</span>. One avoided
          miss covers{" "}
          <span className="font-bold">
            ~{Math.max(1, Math.round(ratio * 12))} months
          </span>{" "}
          of subscription.
        </p>
      </div>

      <p
        className="mt-6 text-[12px] leading-relaxed border-t border-[var(--color-ground)] pt-4"
        style={{ fontFamily: "var(--font-index)" }}
      >
        Illustrative. Uses the 10% IRC §6656 failure-to-deposit rate (16+ day
        delinquency) scaled by typical multi-state filing overhead. Verify your
        actual exposure with your accountant.
      </p>
    </div>
  );
}
