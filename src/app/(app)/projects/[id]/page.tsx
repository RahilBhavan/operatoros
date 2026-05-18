import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
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

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb
        items={[
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ]}
      />
      <header className="border-b-4 border-[var(--color-ground)] pb-3 flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="t-utility mb-2">
            PA-PROJ · {id.slice(0, 6).toUpperCase()}
          </div>
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
            {project.name}
          </h1>
          <div className="t-utility mt-3">
            {project.address ?? "—"}
            {project.jurisdiction_code ? ` · ${project.jurisdiction_code}` : ""}
            {project.gc_business_name ? ` · GC ${project.gc_business_name}` : ""}
            {project.start_date
              ? ` · ${formatDate(project.start_date)} → ${formatDate(project.end_date)}`
              : ""}
            {" · "}
            {project.status}
          </div>
        </div>
        <LinkButton href={`/projects/${id}/edit`} variant="ghost" size="sm">
          Edit →
        </LinkButton>
      </header>

      <section className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-4 py-2 flex items-center justify-between">
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            Project deadlines
          </span>
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            {String((deadlines ?? []).length).padStart(2, "0")}
          </span>
        </div>
        {(deadlines ?? []).length === 0 ? (
          <div className="bg-[var(--color-field)] px-5 py-6">
            <p style={{ fontFamily: "var(--font-index)" }}>
              No deadlines yet. Add permits, inspection windows, lien filing
              dates, certified payroll submissions, and close-out items.
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
                <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5">
                  <div>
                    <div
                      className="font-bold text-[15px]"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {d.name}
                    </div>
                    <div className="t-utility mt-1">
                      {d.governing_agency ?? "—"} · {d.status} ·{" "}
                      {d.severity_tier}
                    </div>
                  </div>
                  <div
                    className="font-bold text-[15px]"
                    style={{
                      fontFamily: "var(--font-index)",
                      color: "var(--color-mark)",
                    }}
                  >
                    {formatDate(d.due_date)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddProjectDeadlineForm projectId={id} />

      <div>
        <LinkButton href="/projects" variant="ghost">
          ← Back to projects
        </LinkButton>
      </div>
    </div>
  );
}
