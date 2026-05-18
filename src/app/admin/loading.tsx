import { KpiCard } from "@/components/doctrine/KpiCard";
import { Skeleton } from "@/components/doctrine/Skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-block w-3 h-3 bg-[var(--color-mark)] motion-safe:animate-pulse"
        />
        <span className="t-utility text-[var(--color-ground)]">
          Routing · loading control tower
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <KpiCard
            key={i}
            label="Loading"
            value={<Skeleton width={120} height={28} />}
            sub={<Skeleton width={80} height={10} />}
          />
        ))}
      </div>
    </div>
  );
}
