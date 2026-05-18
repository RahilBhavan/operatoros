"use client";

import { useEffect, useRef, useState } from "react";
import { StampChip } from "@/components/doctrine/StampChip";

type Client = {
  name: string;
  score: number;
  alert?: boolean;
};

const CLIENTS: Client[] = [
  { name: "Northside Roofing LLC", score: 92 },
  { name: "Lakeview Catering Inc", score: 78 },
  { name: "Brickyard HVAC", score: 64 },
  { name: "Pier 41 Marine Repair", score: 38, alert: true },
];

const ANIMATION_MS = 1200;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PortfolioPreview() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState<number>(() =>
    prefersReducedMotion() ? 1 : 0,
  );
  const [started, setStarted] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (started) return;
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || prefersReducedMotion()) return;
    let raf = 0;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / ANIMATION_MS);
      setProgress(easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  return (
    <div
      ref={containerRef}
      className="border-2 border-[var(--color-ground)] bg-[var(--color-field)]"
      aria-label="Sample accountant client portfolio"
    >
      <div className="flex items-center justify-between p-5 border-b-2 border-[var(--color-ground)]">
        <span className="t-utility text-[var(--color-ground)]">
          Portfolio · sample
        </span>
        <StampChip tone="field">04 · clients</StampChip>
      </div>
      <div className="flex flex-col">
        {CLIENTS.map((client, i) => {
          const displayScore = Math.round(client.score * progress);
          const reachedAlert = client.alert && progress > 0.5;
          const last = i === CLIENTS.length - 1;
          return (
            <div
              key={client.name}
              className={`grid grid-cols-[1fr_auto] items-center px-4 py-2.5 ${
                last ? "" : "border-b border-[var(--color-ground)]"
              }`}
            >
              <div>
                <div
                  className="text-[15px] font-bold"
                  style={{ fontFamily: "var(--font-index)" }}
                >
                  {client.name}
                </div>
                {reachedAlert ? (
                  <div className="t-utility text-[var(--color-mark)] mt-1 !text-[10px]">
                    Action required
                  </div>
                ) : null}
              </div>
              <span
                className="font-black leading-none tabular-nums"
                style={{
                  fontFamily: "var(--font-destination)",
                  fontWeight: 900,
                  fontSize: 28,
                  color: reachedAlert
                    ? "var(--color-mark)"
                    : "var(--color-ground)",
                  letterSpacing: "-0.01em",
                }}
                aria-label={`Score ${client.score} out of 100`}
              >
                {displayScore}
                <span
                  className="text-[13px] font-medium"
                  style={{ fontFamily: "var(--font-index)" }}
                >
                  /100
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t-2 border-[var(--color-ground)] px-5 py-3 t-utility text-[var(--color-ground)]">
        Illustrative · not real clients
      </div>
    </div>
  );
}
