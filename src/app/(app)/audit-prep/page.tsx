import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { ListRow } from "@/components/doctrine/ListRow";
import { PageEmptyState } from "@/components/doctrine/PageEmptyState";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";

export const dynamic = "force-dynamic";

type BinderRow = {
  id: string;
  name: string;
  agency: string | null;
  inspection_date: string | null;
  status: string;
  locked_at: string | null;
  created_at: string;
};

function binderStatusLabel(status: string): string {
  if (status === "locked") return "Locked";
  if (status === "expired") return "Expired";
  return "Draft";
}

export default async function AuditPrepIndex() {
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

  const { data: binders } = await supabase
    .from("audit_binders")
    .select("id, name, agency, inspection_date, status, locked_at, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const binderRows = (binders ?? []) as BinderRow[];

  return (
    <PageShell>
      <PageHeader
        code={`${binderRows.length} binder${binderRows.length === 1 ? "" : "s"}`}
        title="Audit prep"
        description="Build a date-locked binder for an inbound surveyor, inspector, or insurance auditor. Once locked, the snapshot is immutable — exactly what the agency saw on the day of the visit."
        actions={
          <LinkButton href="/audit-prep/new" variant="mark">
            + Start a binder
          </LinkButton>
        }
      />

      {binderRows.length === 0 ? (
        <PageEmptyState
          title="No binders yet"
          description="Start one before your next survey window. We'll pull the relevant deadlines and documents, then mint a surveyor-facing share URL."
          actions={
            <LinkButton href="/audit-prep/new" variant="mark">
              + Start a binder
            </LinkButton>
          }
        />
      ) : (
        <PageSection title="Binders" count={binderRows.length}>
          <ul className="bg-[var(--color-field)]">
            {binderRows.map((b, i) => {
              const secondary = [
                b.agency ?? "Unspecified agency",
                b.inspection_date ? `Inspection ${b.inspection_date}` : null,
              ]
                .filter(Boolean)
                .join(" · ");
              const label = binderStatusLabel(b.status);
              const isLocked = b.status === "locked";

              return (
                <li
                  key={b.id}
                  className={
                    i === binderRows.length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <ListRow
                    href={`/audit-prep/${b.id}`}
                    primary={b.name}
                    secondary={secondary}
                    trailing={
                      <span
                        className={
                          isLocked ? "text-[var(--color-mark)]" : undefined
                        }
                      >
                        {label}
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
