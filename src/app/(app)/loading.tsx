export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] px-6">
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
