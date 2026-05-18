import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";

export const dynamic = "force-dynamic";

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

  return (
    <div className="flex flex-col gap-5">
      <header className="border-b-4 border-[var(--color-ground)] pb-3 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="t-utility mb-2">PA-AUD</div>
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
            Audit prep
          </h1>
          <p
            className="mt-3 max-w-[640px]"
            style={{ fontFamily: "var(--font-index)", fontSize: 15 }}
          >
            Build a date-locked binder for an inbound surveyor, inspector, or
            insurance auditor. Once locked, the snapshot is immutable — exactly
            what the agency saw on the day of the visit.
          </p>
        </div>
        <LinkButton href="/audit-prep/new" variant="mark">
          + Start a binder
        </LinkButton>
      </header>

      {(binders ?? []).length === 0 ? (
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
            No binders yet.
          </h2>
          <p
            className="mt-3 max-w-[480px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            Start one before your next survey window. We&rsquo;ll pull the
            relevant deadlines and documents, then mint a surveyor-facing
            share URL.
          </p>
        </div>
      ) : (
        <section className="border-2 border-[var(--color-ground)]">
          <ul className="bg-[var(--color-field)]">
            {(binders ?? []).map((b, i) => (
              <li
                key={b.id}
                className={
                  i === (binders ?? []).length - 1
                    ? ""
                    : "border-b border-[var(--color-ground)]"
                }
              >
                <Link
                  href={`/audit-prep/${b.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-2.5 no-underline hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
                >
                  <div>
                    <div
                      className="font-bold text-[15px]"
                      style={{ fontFamily: "var(--font-index)" }}
                    >
                      {b.name}
                    </div>
                    <div className="t-utility mt-1">
                      {b.agency ?? "Unspecified agency"}
                      {b.inspection_date
                        ? ` · inspection ${b.inspection_date}`
                        : ""}
                    </div>
                  </div>
                  <div className="t-utility shrink-0">
                    {b.status === "locked"
                      ? "LOCKED"
                      : b.status === "expired"
                      ? "Expired"
                      : "Draft"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
