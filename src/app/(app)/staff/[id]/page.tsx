import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";
import { Body } from "@/components/doctrine/Typography";
import { nav } from "@/lib/ui-copy";
import StaffCredentialAdder from "@/components/staff/StaffCredentialAdder";

export const dynamic = "force-dynamic";

type CredRow = {
  id: string;
  credential_type_id: string;
  identifier: string | null;
  issued_date: string | null;
  expires_date: string | null;
  status: string;
};

type CredType = {
  id: string;
  slug: string;
  name: string;
  agency: string | null;
  default_validity_days: number | null;
  vertical_tag: string | null;
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusFor(c: CredRow): "ok" | "soon" | "expired" {
  if (c.status === "revoked" || c.status === "expired") return "expired";
  if (!c.expires_date) return "ok";
  const ms = new Date(c.expires_date).getTime() - Date.now();
  if (ms < 0) return "expired";
  if (ms < 30 * 86400 * 1000) return "soon";
  return "ok";
}

function statusLabel(dot: ReturnType<typeof statusFor>): string {
  if (dot === "expired") return "Expired";
  if (dot === "soon") return "Renew within 30 days";
  return "Current";
}

export default async function StaffDetailPage({
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
    .select("id, industry_slug")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  const { data: staff } = await supabase
    .from("staff_members")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!staff) notFound();

  const { data: creds } = await supabase
    .from("staff_credentials")
    .select(
      "id, credential_type_id, identifier, issued_date, expires_date, status",
    )
    .eq("staff_member_id", id);

  const { data: credTypes } = await supabase
    .from("credential_types")
    .select("id, slug, name, agency, default_validity_days, vertical_tag")
    .order("name", { ascending: true });

  const credTypeMap = new Map<string, CredType>();
  for (const t of (credTypes ?? []) as CredType[]) credTypeMap.set(t.id, t);

  const sortedCreds = ((creds ?? []) as CredRow[]).slice().sort((a, b) => {
    const ax = a.expires_date ?? "9999";
    const bx = b.expires_date ?? "9999";
    return ax.localeCompare(bx);
  });

  const metaParts = [
    staff.role ?? null,
    staff.employment_type ?? null,
    staff.hire_date ? `Hired ${formatDate(staff.hire_date)}` : null,
    staff.email ?? null,
  ].filter(Boolean);

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: "Staff", href: "/staff" },
          { label: staff.full_name },
        ]}
      />

      <PageHeader
        title={staff.full_name}
        meta={metaParts.join(" · ")}
        actions={
          <LinkButton href={`/staff/${id}/edit`} variant="ghost" size="sm">
            {nav.edit}
          </LinkButton>
        }
      />

      <PageSection
        title="Credentials"
        count={sortedCreds.length}
        subtitle="Licenses, certifications, and training that renew on a cycle"
      >
        {sortedCreds.length === 0 ? (
          <Body className="bg-[var(--color-field)] px-5 py-6">
            No credentials yet. Add one below to start tracking renewals.
          </Body>
        ) : (
          <ul className="bg-[var(--color-field)]">
            {sortedCreds.map((c, i) => {
              const t = credTypeMap.get(c.credential_type_id);
              const dot = statusFor(c);
              const urgent = dot === "expired" || dot === "soon";

              return (
                <li
                  key={c.id}
                  className={
                    i === sortedCreds.length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <Body className="font-bold">{t?.name ?? "Unknown credential"}</Body>
                      <p className="t-utility mt-1">
                        {t?.agency ?? "—"}
                        {c.identifier ? ` · ${c.identifier}` : ""}
                        {c.issued_date
                          ? ` · Issued ${formatDate(c.issued_date)}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Body
                        className={`font-bold tabular-nums ${urgent ? "text-[var(--color-mark)]" : ""}`}
                      >
                        {formatDate(c.expires_date)}
                      </Body>
                      <p
                        className={`t-utility mt-1 ${dot === "expired" ? "text-[var(--color-mark)]" : ""}`}
                      >
                        {statusLabel(dot)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageSection>

      <StaffCredentialAdder
        staffMemberId={id}
        credentialTypes={(credTypes ?? []) as CredType[]}
      />

      <LinkButton href="/staff" variant="ghost">
        {nav.backToStaff}
      </LinkButton>
    </PageShell>
  );
}
