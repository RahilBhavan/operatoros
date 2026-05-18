import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";

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

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b-2 border-[var(--color-ground)] pb-5 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="t-utility mb-2">PA-STAF</div>
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
            Staff &amp; credentials
          </h1>
          <p
            className="mt-3 max-w-[640px]"
            style={{ fontFamily: "var(--font-index)", fontSize: 15 }}
          >
            Track per-person credentials — CPR, OSHA 10/30, food handler, state
            board licenses, CE hours — alongside entity-level deadlines.
            Reminders fire on the same schedule.
          </p>
        </div>
        <LinkButton href="/staff/new" variant="mark">
          + Add staff member
        </LinkButton>
      </header>

      {(staff ?? []).length === 0 ? (
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
            No staff on file.
          </h2>
          <p
            className="mt-3 max-w-[480px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            Add caregivers, technicians, drivers, or practitioners whose
            credentials renew on a cycle.
          </p>
          <div className="mt-5">
            <LinkButton href="/staff/new" variant="mark">
              + Add first staff member
            </LinkButton>
          </div>
        </div>
      ) : (
        <section className="border-2 border-[var(--color-ground)]">
          <div className="panel-ink px-5 py-3 flex items-center justify-between">
            <span className="t-utility" style={{ color: "var(--color-field)" }}>
              Roster · active
            </span>
            <span className="t-utility" style={{ color: "var(--color-field)" }}>
              {String((staff ?? []).length).padStart(2, "0")}
            </span>
          </div>
          <ul className="bg-[var(--color-field)]">
            {((staff ?? []) as StaffRow[]).map((s, i) => {
              const creds = credsByStaff.get(s.id) ?? [];
              const expired = creds.filter(
                (c) => statusDot(c.expires_date) === "expired"
              ).length;
              const soon = creds.filter(
                (c) => statusDot(c.expires_date) === "soon"
              ).length;
              return (
                <li
                  key={s.id}
                  className={
                    i === (staff ?? []).length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <Link
                    href={`/staff/${s.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 no-underline hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
                  >
                    <div>
                      <div
                        className="font-bold text-[15px]"
                        style={{ fontFamily: "var(--font-index)" }}
                      >
                        {s.full_name}
                      </div>
                      <div className="t-utility mt-1">
                        {s.role ?? "—"}
                        {s.employment_type ? ` · ${s.employment_type}` : ""}
                        {creds.length > 0
                          ? ` · ${creds.length} credential${creds.length === 1 ? "" : "s"}`
                          : ""}
                      </div>
                    </div>
                    <div className="t-utility shrink-0">
                      {expired > 0 ? (
                        <span className="text-[var(--color-mark)]">
                          {expired} expired
                        </span>
                      ) : soon > 0 ? (
                        <span>{soon} expiring ≤30d</span>
                      ) : (
                        "All current"
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
