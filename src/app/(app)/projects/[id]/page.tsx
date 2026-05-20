import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";
import { Body } from "@/components/doctrine/Typography";
import { nav } from "@/lib/ui-copy";
import AddProjectDeadlineForm from "@/components/projects/AddProjectDeadlineForm";

export const dynamic = "force-dynamic";

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ProjectDetail({
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

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!project) notFound();

  const { data: deadlines } = await supabase
    .from("project_deadlines")
    .select("id, name, due_date, governing_agency, status, severity_tier")
    .eq("project_id", id)
    .order("due_date", { ascending: true });

  const deadlineRows = deadlines ?? [];
  const metaParts = [
    project.address ?? null,
    project.jurisdiction_code ?? null,
    project.gc_business_name ? `GC: ${project.gc_business_name}` : null,
    project.start_date
      ? `${formatDate(project.start_date)} → ${formatDate(project.end_date)}`
      : null,
    project.status,
  ].filter(Boolean);

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ]}
      />

      <PageHeader
        title={project.name}
        meta={metaParts.join(" · ")}
        actions={
          <LinkButton href={`/projects/${id}/edit`} variant="ghost" size="sm">
            {nav.edit}
          </LinkButton>
        }
      />

      <PageSection
        title="Project deadlines"
        count={deadlineRows.length}
        subtitle="Permits, inspections, lien dates, payroll, and close-out items for this job"
      >
        {deadlineRows.length === 0 ? (
          <Body className="bg-[var(--color-field)] px-5 py-6">
            No deadlines yet. Add the first obligation for this jobsite below.
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
                <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <Body className="font-bold">{d.name}</Body>
                    <p className="t-utility mt-1">
                      {d.governing_agency ?? "—"} · {d.status.replace(/_/g, " ")} ·{" "}
                      {d.severity_tier}
                    </p>
                  </div>
                  <Body className="font-bold tabular-nums text-[var(--color-mark)] shrink-0">
                    {formatDate(d.due_date)}
                  </Body>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <AddProjectDeadlineForm projectId={id} />

      <LinkButton href="/projects" variant="ghost">
        {nav.backToProjects}
      </LinkButton>
    </PageShell>
  );
}
