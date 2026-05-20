import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { ListRow } from "@/components/doctrine/ListRow";
import { PageEmptyState } from "@/components/doctrine/PageEmptyState";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";
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

type DeadlineRow = {
  location_id: string | null;
  status: string;
  due_date: string;
  severity_tier: string | null;
  penalty_estimate_cents: number | null;
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

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("location_id, status, due_date, severity_tier, penalty_estimate_cents")
    .eq("business_id", business.id);

  const byLoc = new Map<string, DeadlineRow[]>();
  for (const d of (deadlines ?? []) as DeadlineRow[]) {
    if (!d.location_id) continue;
    const arr = byLoc.get(d.location_id) ?? [];
    arr.push(d);
    byLoc.set(d.location_id, arr);
  }

  const locationRows = (locations ?? []) as Loc[];

  return (
    <PageShell>
      <PageHeader
        code={`${locationRows.length} location${locationRows.length === 1 ? "" : "s"}`}
        title="Locations"
        description="Manage every storefront, taproom, branch, or jobsite under one account. Per-location deadlines roll up into the score shown on each row."
        actions={
          <LinkButton href="/locations/new" variant="mark">
            + Add location
          </LinkButton>
        }
      />

      {locationRows.length === 0 ? (
        <PageEmptyState
          title="No locations on file"
          description="Your primary location is created automatically at onboarding. Add additional storefronts here."
          actions={
            <LinkButton href="/locations/new" variant="mark">
              + Add location
            </LinkButton>
          }
        />
      ) : (
        <PageSection title="Roster" count={locationRows.length}>
          <ul className="bg-[var(--color-field)]">
            {locationRows.map((l, i) => {
              const dls = byLoc.get(l.id) ?? [];
              const score = computeRiskWeightedScore(
                dls as Parameters<typeof computeRiskWeightedScore>[0],
              );
              const overdue = dls.filter((d) => d.status === "overdue").length;
              const title = l.name ?? `${l.city ?? "Primary"} location`;
              const addressLine = [
                [l.city ?? "—", l.state].join(", "),
                l.address ?? null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li
                  key={l.id}
                  className={
                    i === locationRows.length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <ListRow
                    href={`/locations/${l.id}`}
                    primary={title}
                    secondary={addressLine}
                    trailing={
                      <span className={overdue > 0 ? "text-[var(--color-mark)]" : undefined}>
                        {dls.length} deadline{dls.length === 1 ? "" : "s"}
                        {overdue > 0 ? ` · ${overdue} overdue` : ""}
                      </span>
                    }
                    end={
                      <span
                        className="font-black text-[var(--color-mark)] tabular-nums group-hover:text-[var(--color-field)]"
                        style={{
                          fontFamily: "var(--font-destination)",
                          fontSize: 24,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {score}
                      </span>
                    }
                  />
                </li>
              );
            })}
          </ul>
        </PageSection>
      )}
    </PageShell>
  );
}
