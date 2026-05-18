import { KpiCard } from "@/components/doctrine/KpiCard";

/**
 * Admin loading state. The AdminNav is rendered by the surrounding layout,
 * so this only fills the <main> area with skeleton KPI cards over the
 * standard admin grid.
 */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-block w-3 h-3 bg-[var(--color-mark)] motion-safe:animate-pulse"
        />
        <span className="t-utility text-[var(--color-ground)]">
          Routing · loading control tower
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Loading"
          value={<SkeletonBar width={120} />}
          sub={<SkeletonBar width={80} />}
        />
        <KpiCard
          label="Loading"
          value={<SkeletonBar width={120} />}
          sub={<SkeletonBar width={80} />}
        />
        <KpiCard
          label="Loading"
          value={<SkeletonBar width={120} />}
          sub={<SkeletonBar width={80} />}
        />
      </div>
    </div>
  );
}

function SkeletonBar({ width }: { width: number }) {
  return (
    <span
      aria-hidden
      className="inline-block bg-[var(--color-field)] motion-safe:animate-pulse"
      style={{
        width,
        height: 28,
        border: "2px solid var(--color-field)",
        opacity: 0.4,
        backgroundImage:
          "repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 12px)",
      }}
    />
  );
}
