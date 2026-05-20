import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";
import { Body } from "@/components/doctrine/Typography";
import { computeRiskWeightedScore, formatDueDate } from "@/lib/deadline-utils";
import { nav } from "@/lib/ui-copy";

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

  const deadlineRows = deadlines ?? [];
  const score = computeRiskWeightedScore(
    deadlineRows as Parameters<typeof computeRiskWeightedScore>[0],
  );

  const title = location.name ?? `${location.city ?? "Primary"} location`;
  const meta = [
    [location.city ?? "—", location.state].join(", "),
    location.address ?? null,
    location.zip ?? null,
    `Compliance score ${score}/100`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: "Locations", href: "/locations" },
          { label: title },
        ]}
      />

      <PageHeader
        title={title}
        meta={meta}
        actions={
          <LinkButton href={`/locations/${id}/edit`} variant="ghost" size="sm">
            {nav.edit}
          </LinkButton>
        }
      />

      <PageSection
        title="Deadlines at this location"
        count={deadlineRows.length}
        subtitle="Only obligations assigned to this site appear here"
      >
        {deadlineRows.length === 0 ? (
          <Body className="bg-[var(--color-field)] px-5 py-6">
            No deadlines are assigned to this location yet. Reassign deadlines from
            the main deadlines list if needed.
          </Body>
        ) : (
          <ul className="bg-[var(--color-field)]">
            {deadlineRows.map((d, i) => (
              <li
                key={d.id}
                className={
                  i === deadlineRows.length - 1
                    ? ""
                    : "border-b border-[var(--color-ground)]"
                }
              >
                <Link
                  href={`/deadlines/${d.id}`}
                  className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 no-underline hover:bg-[var(--color-ground)] hover:text-[var(--color-field)] group"
                >
                  <div className="min-w-0">
                    <Body className="font-bold group-hover:text-[var(--color-field)]">
                      {d.name}
                    </Body>
                    <p className="t-utility mt-1 group-hover:text-[var(--color-field)]">
                      {d.governing_agency ?? "—"} · {d.status.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Body className="font-bold tabular-nums text-[var(--color-mark)] group-hover:text-[var(--color-field)] shrink-0">
                    {formatDueDate(d.due_date)}
                  </Body>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <LinkButton href="/locations" variant="ghost">
        {nav.backToLocations}
      </LinkButton>
    </PageShell>
  );
}
