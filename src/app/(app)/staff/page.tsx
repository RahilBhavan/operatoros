import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { ListRow } from "@/components/doctrine/ListRow";
import { PageEmptyState } from "@/components/doctrine/PageEmptyState";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";

export const dynamic = "force-dynamic";

type StaffRow = {
  id: string;
  full_name: string;
  role: string | null;
  employment_type: string | null;
  end_date: string | null;
};

type CredentialRow = {
  id: string;
  staff_member_id: string;
  expires_date: string | null;
  status: string;
};

function statusDot(expires: string | null): "ok" | "soon" | "expired" | "n/a" {
  if (!expires) return "n/a";
  const ms = new Date(expires).getTime() - Date.now();
  if (ms < 0) return "expired";
  if (ms < 30 * 86400 * 1000) return "soon";
  return "ok";
}

function credentialSummary(creds: CredentialRow[]): {
  label: string;
  urgent: boolean;
} {
  const expired = creds.filter(
    (c) => statusDot(c.expires_date) === "expired",
  ).length;
  const soon = creds.filter((c) => statusDot(c.expires_date) === "soon").length;
  if (expired > 0) {
    return {
      label: `${expired} expired`,
      urgent: true,
    };
  }
  if (soon > 0) {
    return { label: `${soon} expiring ≤30d`, urgent: false };
  }
  return { label: "All current", urgent: false };
}

export default async function StaffIndex() {
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

  const { data: staff } = await supabase
    .from("staff_members")
    .select("id, full_name, role, employment_type, end_date")
    .eq("business_id", business.id)
    .is("end_date", null)
    .order("full_name", { ascending: true });

  const { data: credentials } = await supabase
    .from("staff_credentials")
    .select("id, staff_member_id, expires_date, status")
    .eq("business_id", business.id);

  const credsByStaff = new Map<string, CredentialRow[]>();
  for (const c of (credentials ?? []) as CredentialRow[]) {
    const arr = credsByStaff.get(c.staff_member_id) ?? [];
    arr.push(c);
    credsByStaff.set(c.staff_member_id, arr);
  }

  const staffRows = (staff ?? []) as StaffRow[];

  return (
    <PageShell>
      <PageHeader
        code={`${staffRows.length} active staff member${staffRows.length === 1 ? "" : "s"}`}
        title="Staff & credentials"
        description="Track per-person credentials — CPR, OSHA 10/30, food handler, state board licenses, CE hours — alongside entity-level deadlines. Reminders follow the same schedule."
        actions={
          <LinkButton href="/staff/new" variant="mark">
            + Add staff member
          </LinkButton>
        }
      />

      {staffRows.length === 0 ? (
        <PageEmptyState
          title="No staff on file"
          description="Add caregivers, technicians, drivers, or practitioners whose credentials renew on a cycle."
          actions={
            <LinkButton href="/staff/new" variant="mark">
              + Add first staff member
            </LinkButton>
          }
        />
      ) : (
        <PageSection title="Active roster" count={staffRows.length}>
          <ul className="bg-[var(--color-field)]">
            {staffRows.map((s, i) => {
              const creds = credsByStaff.get(s.id) ?? [];
              const summary = credentialSummary(creds);
              const secondary = [
                s.role ?? "—",
                s.employment_type ?? null,
                creds.length > 0
                  ? `${creds.length} credential${creds.length === 1 ? "" : "s"}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li
                  key={s.id}
                  className={
                    i === staffRows.length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <ListRow
                    href={`/staff/${s.id}`}
                    primary={s.full_name}
                    secondary={secondary}
                    trailing={
                      <span
                        className={
                          summary.urgent ? "text-[var(--color-mark)]" : undefined
                        }
                      >
                        {summary.label}
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
