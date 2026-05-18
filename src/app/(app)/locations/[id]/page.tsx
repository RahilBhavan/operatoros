import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { computeRiskWeightedScore, formatDueDate } from "@/lib/deadline-utils";

export const dynamic = "force-dynamic";

export default async function LocationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: location } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!location) notFound();

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("*")
    .eq("business_id", business.id)
    .eq("location_id", id)
    .order("due_date", { ascending: true });

  const score = computeRiskWeightedScore(
    (deadlines ?? []) as Parameters<typeof computeRiskWeightedScore>[0]
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b-2 border-[var(--color-ground)] pb-5 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="t-utility mb-2">PA-LOC · {id.slice(0, 6).toUpperCase()}</div>
          <h1
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 900,
              fontSize: "clamp(36px, 5vw, 56px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            {location.name ?? `${location.city ?? "Primary"} location`}
          </h1>
          <div className="t-utility mt-3">
            {location.city ?? "—"}, {location.state}
            {location.address ? ` · ${location.address}` : ""}
            {location.zip ? ` · ${location.zip}` : ""}
          </div>
        </div>
        <div
          className="font-bold"
          style={{
            fontFamily: "var(--font-destination)",
            fontSize: 56,
            lineHeight: 1,
            color: "var(--color-mark)",
          }}
        >
          {score}
          <span style={{ fontSize: 18, marginLeft: 4 }}>/100</span>
        </div>
      </header>

      <section className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-5 py-3 flex items-center justify-between">
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            Per-location deadlines
          </span>
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            {String((deadlines ?? []).length).padStart(2, "0")}
          </span>
        </div>
        {(deadlines ?? []).length === 0 ? (
          <div className="bg-[var(--color-field)] px-5 py-6">
            <p style={{ fontFamily: "var(--font-index)" }}>
              No deadlines are scoped to this location yet. Existing deadlines
              can be reassigned from the Deadlines page.
            </p>
          </div>
        ) : (
          <ul className="bg-[var(--color-field)]">
            {(deadlines ?? []).map((d, i) => (
              <li
                key={d.id}
                className={
                  i === (deadlines ?? []).length - 1
                    ? ""
                    : "border-b border-[var(--color-ground)]"
                }
              >
                <Link
                  href={`/deadlines/${d.id}`}
                  className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 no-underline hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
                >
                  <div>
                    <div
                      className="font-bold text-[15px]"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {d.name}
                    </div>
                    <div className="t-utility mt-1">
                      {d.governing_agency ?? "—"} · {d.status}
                    </div>
                  </div>
                  <div
                    className="font-bold text-[15px]"
                    style={{
                      fontFamily: "var(--font-index)",
                      color: "var(--color-mark)",
                    }}
                  >
                    {formatDueDate(d.due_date)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div>
        <LinkButton href="/locations" variant="ghost">
          ← Back to locations
        </LinkButton>
      </div>
    </div>
  );
}
