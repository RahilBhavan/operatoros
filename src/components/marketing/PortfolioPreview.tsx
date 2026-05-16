"use client";

import { useEffect, useRef, useState } from "react";

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
  // Hydrates to 0 on SSR; client first paint sets the final state for
  // reduced-motion users without a cascading effect render.
  const [progress, setProgress] = useState<number>(() =>
    prefersReducedMotion() ? 1 : 0,
  );
  const [started, setStarted] = useState<boolean>(() =>
    prefersReducedMotion(),
  );

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
      className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-6"
      aria-label="Sample accountant client portfolio"
    >
      <p className="t-utility text-[var(--color-ground)] opacity-70 mb-4">
        Client portfolio · sample
      </p>
      <div className="flex flex-col gap-3">
        {CLIENTS.map((client) => {
          const displayScore = Math.round(client.score * progress);
          const reachedAlert = client.alert && progress > 0.5;
          const tone = reachedAlert
            ? "text-[var(--color-mark)]"
            : "text-[var(--color-ground)]";
          return (
            <div
              key={client.name}
              className="flex items-center justify-between border-b border-[var(--color-ground)]/20 last:border-0 pb-3 last:pb-0"
            >
              <span className="text-[15px] font-semibold text-[var(--color-ground)]">
                {client.name}
              </span>
              <span
                className={`text-[15px] font-bold tabular-nums transition-colors duration-200 ${tone}`}
                aria-label={`Score ${client.score} out of 100`}
              >
                {displayScore}/100
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[12px] uppercase tracking-widest text-[var(--color-ground)] opacity-50">
        Illustrative — sample data, not real clients
      </p>
    </div>
  );
}
