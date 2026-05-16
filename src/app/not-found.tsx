import Link from "next/link";
import { Wordmark } from "@/components/doctrine/Wordmark";
import { StampChip } from "@/components/doctrine/StampChip";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-field)] flex flex-col">
      <header className="border-b border-[var(--color-ground)] px-6 py-5">
        <div className="max-w-[1160px] mx-auto">
          <Wordmark size={20} />
        </div>
      </header>

      <main className="flex-1 flex items-center px-6 py-16">
        <div className="max-w-[680px] mx-auto w-full">
          <StampChip tone="mark">Not on the manifest · 404</StampChip>
          <h1
            className="mt-6"
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 900,
              fontSize: 60,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "var(--color-ground)",
            }}
          >
            No route here.
          </h1>
          <div className="rule-stamp mt-6" />
          <p
            className="mt-6"
            style={{
              fontFamily: "var(--font-index)",
              fontWeight: 400,
              fontSize: 17,
              lineHeight: 1.55,
              color: "var(--color-ground)",
            }}
          >
            The page you asked for isn&apos;t routed. It may have moved, or the
            link may be stale. Pick a destination below.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn">
              Dashboard →
            </Link>
            <Link href="/" className="btn btn-ghost">
              Landing page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
