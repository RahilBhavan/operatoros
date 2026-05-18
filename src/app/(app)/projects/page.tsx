import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";

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
      "id, name, customer_name, gc_business_name, start_date, end_date, status, value_cents"
    )
    .eq("business_id", business.id)
    .order("start_date", { ascending: false, nullsFirst: false });

  return (
    <div className="flex flex-col gap-5">
      <header className="border-b-4 border-[var(--color-ground)] pb-3 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="t-utility mb-2">PA-PROJ</div>
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
            Projects
          </h1>
          <p
            className="mt-3 max-w-[640px]"
            style={{ fontFamily: "var(--font-index)", fontSize: 15 }}
          >
            Per-jobsite compliance: permits, 811 dig tickets, SWPPP
            inspections, lien deadlines, certified payroll. Each project gets
            its own deadline list and document folder.
          </p>
        </div>
        <LinkButton href="/projects/new" variant="mark">
          + New project
        </LinkButton>
      </header>

      {(projects ?? []).length === 0 ? (
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
            No projects yet.
          </h2>
          <p
            className="mt-3 max-w-[480px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            Add a job to start tracking its per-project deadlines.
          </p>
        </div>
      ) : (
        <section className="border-2 border-[var(--color-ground)]">
          <ul className="bg-[var(--color-field)]">
            {((projects ?? []) as ProjectRow[]).map((p, i) => (
              <li
                key={p.id}
                className={
                  i === (projects ?? []).length - 1
                    ? ""
                    : "border-b border-[var(--color-ground)]"
                }
              >
                <Link
                  href={`/projects/${p.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-2.5 no-underline hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
                >
                  <div>
                    <div
                      className="font-bold text-[15px]"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {p.name}
                    </div>
                    <div className="t-utility mt-1">
                      {p.gc_business_name ?? p.customer_name ?? "—"}
                      {p.start_date ? ` · start ${p.start_date}` : ""}
                      {p.value_cents ? ` · ${formatCents(p.value_cents)}` : ""}
                    </div>
                  </div>
                  <div className="t-utility shrink-0">{p.status}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
