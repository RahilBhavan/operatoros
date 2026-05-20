import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { ListRow } from "@/components/doctrine/ListRow";
import { PageEmptyState } from "@/components/doctrine/PageEmptyState";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";

export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  name: string;
  customer_name: string | null;
  gc_business_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  value_cents: number | null;
};

function formatCents(c: number | null): string {
  if (!c || c <= 0) return "";
  return `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default async function ProjectsIndex() {
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

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, name, customer_name, gc_business_name, start_date, end_date, status, value_cents",
    )
    .eq("business_id", business.id)
    .order("start_date", { ascending: false, nullsFirst: false });

  const projectRows = (projects ?? []) as ProjectRow[];

  return (
    <PageShell>
      <PageHeader
        code={`${projectRows.length} project${projectRows.length === 1 ? "" : "s"}`}
        title="Projects"
        description="Per-jobsite compliance: permits, dig tickets, SWPPP inspections, lien deadlines, and certified payroll. Each project has its own deadlines and documents."
        actions={
          <LinkButton href="/projects/new" variant="mark">
            + New project
          </LinkButton>
        }
      />

      {projectRows.length === 0 ? (
        <PageEmptyState
          title="No projects yet"
          description="Add a job to start tracking its per-project deadlines."
          actions={
            <LinkButton href="/projects/new" variant="mark">
              + New project
            </LinkButton>
          }
        />
      ) : (
        <PageSection title="Active jobs" count={projectRows.length}>
          <ul className="bg-[var(--color-field)]">
            {projectRows.map((p, i) => {
              const secondary = [
                p.gc_business_name ?? p.customer_name ?? "—",
                p.start_date ? `Start ${p.start_date}` : null,
                p.value_cents ? formatCents(p.value_cents) : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li
                  key={p.id}
                  className={
                    i === projectRows.length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <ListRow
                    href={`/projects/${p.id}`}
                    primary={p.name}
                    secondary={secondary}
                    trailing={p.status.replace(/_/g, " ")}
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
