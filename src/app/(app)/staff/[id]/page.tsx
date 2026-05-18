import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
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
      "id, credential_type_id, identifier, issued_date, expires_date, status"
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

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b-2 border-[var(--color-ground)] pb-5">
        <div className="t-utility mb-2">PA-STAF · {id.slice(0, 6).toUpperCase()}</div>
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
          {staff.full_name}
        </h1>
        <div className="t-utility mt-3">
          {staff.role ?? "—"}
          {staff.employment_type ? ` · ${staff.employment_type}` : ""}
          {staff.hire_date ? ` · hired ${formatDate(staff.hire_date)}` : ""}
          {staff.email ? ` · ${staff.email}` : ""}
        </div>
      </header>

      <section className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            Credentials
          </span>
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            {String(sortedCreds.length).padStart(2, "0")}
          </span>
        </div>
        {sortedCreds.length === 0 ? (
          <div className="bg-[var(--color-field)] px-5 py-6">
            <p style={{ fontFamily: "var(--font-index)" }}>
              No credentials added yet. Use the picker below to add one.
            </p>
          </div>
        ) : (
          <ul className="bg-[var(--color-field)]">
            {sortedCreds.map((c, i) => {
              const t = credTypeMap.get(c.credential_type_id);
              const dot = statusFor(c);
              return (
                <li
                  key={c.id}
                  className={
                    i === sortedCreds.length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4">
                    <div>
                      <div
                        className="font-bold text-[15px]"
                        style={{ fontFamily: "var(--font-index)" }}
                      >
                        {t?.name ?? "Unknown credential"}
                      </div>
                      <div className="t-utility mt-1">
                        {t?.agency ?? "—"}
                        {c.identifier ? ` · ${c.identifier}` : ""}
                        {c.issued_date
                          ? ` · issued ${formatDate(c.issued_date)}`
                          : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-bold text-[15px]"
                        style={{
                          fontFamily: "var(--font-index)",
                          color:
                            dot === "expired"
                              ? "var(--color-mark)"
                              : "var(--color-ground)",
                        }}
                      >
                        {formatDate(c.expires_date)}
                      </div>
                      <div className="t-utility mt-1">
                        {dot === "expired"
                          ? "Expired"
                          : dot === "soon"
                          ? "Renew soon"
                          : "Current"}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <StaffCredentialAdder
        staffMemberId={id}
        credentialTypes={(credTypes ?? []) as CredType[]}
      />

      <div>
        <LinkButton href="/staff" variant="ghost">
          ← Back to staff
        </LinkButton>
      </div>
    </div>
  );
}
