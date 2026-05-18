import { Skeleton } from "@/components/doctrine/Skeleton";

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <header className="flex items-end justify-between flex-wrap gap-3 pb-3 border-b-4 border-[var(--color-ground)]">
        <div className="flex flex-col gap-2">
          <Skeleton width={180} height={12} />
          <Skeleton width={260} height={36} />
        </div>
        <Skeleton width={140} height={36} />
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-2 border-[var(--color-ground)] px-4 py-3 flex flex-col gap-2 min-h-[96px]"
          >
            <Skeleton width={80} height={10} />
            <Skeleton width={60} height={36} />
            <Skeleton width={100} height={10} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-block w-3 h-3 bg-[var(--color-mark)] motion-safe:animate-pulse"
        />
        <span className="t-utility text-[var(--color-ground)]">
          Routing · loading manifest
        </span>
      </div>
    </div>
  );
}
