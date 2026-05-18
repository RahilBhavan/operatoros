import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { computeRiskWeightedScore } from "@/lib/deadline-utils";

export const dynamic = "force-dynamic";

type Loc = {
  id: string;
  name: string | null;
  state: string;
  city: string | null;
  address: string | null;
  open_date: string | null;
  close_date: string | null;
};

export default async function LocationsIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, state, city, address, open_date, close_date")
    .eq("business_id", business.id)
    .order("open_date", { ascending: true, nullsFirst: false });

  // Aggregate per-location deadlines for the rollup card.
  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("location_id, status, due_date, severity_tier, penalty_estimate_cents")
    .eq("business_id", business.id);

  type DeadlineRow = NonNullable<typeof deadlines>[number];
  const byLoc = new Map<string, DeadlineRow[]>();
  for (const d of deadlines ?? []) {
    if (!d.location_id) continue;
    const arr = byLoc.get(d.location_id) ?? [];
    arr.push(d);
    byLoc.set(d.location_id, arr);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="border-b-4 border-[var(--color-ground)] pb-3 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="t-utility mb-2">PA-LOC</div>
          <h1
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 900,
              fontSize: "clamp(30px, 4vw, 44px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Locations
          </h1>
          <p
            className="mt-3 max-w-[640px]"
            style={{ fontFamily: "var(--font-index)", fontSize: 15 }}
          >
            Manage every storefront, taproom, branch, or jobsite under one
            account. Per-location deadlines roll up into the aggregator view
            below.
          </p>
        </div>
        <LinkButton href="/locations/new" variant="mark">
          + Add location
        </LinkButton>
      </header>

      {(locations ?? []).length === 0 ? (
        <div className="border-2 border-[var(--color-ground)] p-10">
          <h2
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: 32,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            No locations on file.
          </h2>
          <p
            className="mt-3 max-w-[480px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            Your primary location is created automatically at onboarding; add
            additional storefronts here.
          </p>
        </div>
      ) : (
        <section className="border-2 border-[var(--color-ground)]">
          <div className="panel-ink px-4 py-2 flex items-center justify-between">
            <span className="t-utility" style={{ color: "var(--color-field)" }}>
              Roster
            </span>
            <span className="t-utility" style={{ color: "var(--color-field)" }}>
              {String((locations ?? []).length).padStart(2, "0")}
            </span>
          </div>
          <ul className="bg-[var(--color-field)]">
            {((locations ?? []) as Loc[]).map((l, i) => {
              const dls = byLoc.get(l.id) ?? [];
              const score = computeRiskWeightedScore(
                dls as Parameters<typeof computeRiskWeightedScore>[0]
              );
              const overdue = dls.filter((d) => d.status === "overdue").length;
              return (
                <li
                  key={l.id}
                  className={
                    i === (locations ?? []).length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <Link
                    href={`/locations/${l.id}`}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-6 px-4 py-2.5 no-underline hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
                  >
                    <div>
                      <div
                        className="font-bold text-[15px]"
                        style={{ fontFamily: "var(--font-index)" }}
                      >
                        {l.name ?? `${l.city ?? "Primary"} location`}
                      </div>
                      <div className="t-utility mt-1">
                        {l.city ?? "—"}, {l.state}
                        {l.address ? ` · ${l.address}` : ""}
                      </div>
                    </div>
                    <div className="t-utility shrink-0">
                      {dls.length} deadline{dls.length === 1 ? "" : "s"}
                      {overdue > 0 ? ` · ${overdue} overdue` : ""}
                    </div>
                    <div
                      className="font-bold shrink-0"
                      style={{
                        fontFamily: "var(--font-destination)",
                        fontSize: 24,
                        color: "var(--color-mark)",
                      }}
                    >
                      {score}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
