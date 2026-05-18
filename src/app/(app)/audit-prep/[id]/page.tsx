import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LockBinderButton from "@/components/audit-prep/LockBinderButton";
import { LinkButton } from "@/components/doctrine/Button";

export const dynamic = "force-dynamic";

type SnapshotShape = {
  deadlines?: Array<{
    id: string;
    name: string;
    due_date: string;
    governing_agency: string | null;
    status: string;
    severity_tier?: string | null;
  }>;
  generated_at?: string;
};

export default async function BinderDetailPage({
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

  const { data: binder } = await supabase
    .from("audit_binders")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!binder) notFound();

  // For draft binders, surface live deadlines that match the agency filter so
  // the user can confirm before locking. For locked binders, use the
  // snapshotted set so the surveyor sees the same data as on lock day.
  let preview: SnapshotShape["deadlines"] = [];
  if (binder.status === "locked") {
    const snap = (binder.snapshot ?? {}) as SnapshotShape;
    preview = snap.deadlines ?? [];
  } else {
    const agency = binder.agency?.toLowerCase() ?? null;
    const { data: live } = await supabase
      .from("deadlines")
      .select("id, name, due_date, governing_agency, status, severity_tier")
      .eq("business_id", business.id)
      .order("due_date", { ascending: true });
    preview = (live ?? []).filter((d) => {
      if (!agency) return true;
      return d.governing_agency?.toLowerCase().includes(agency);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b-2 border-[var(--color-ground)] pb-5 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="t-utility mb-2">
            PA-AUD · {id.slice(0, 6).toUpperCase()}
          </div>
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
            {binder.name}
          </h1>
          <div className="t-utility mt-3">
            {binder.agency ?? "All agencies"} ·{" "}
            {binder.status === "locked" ? (
              <span className="text-[var(--color-mark)]">
                🔒 LOCKED
                {binder.locked_at
                  ? ` ${new Date(binder.locked_at).toLocaleDateString()}`
                  : ""}
              </span>
            ) : (
              "Draft"
            )}
          </div>
        </div>
        {binder.status === "draft" ? (
          <LockBinderButton binderId={id} />
        ) : null}
      </header>

      {binder.scope ? (
        <section className="border-2 border-[var(--color-ground)]">
          <div className="panel-ink px-5 py-3">
            <span className="t-utility" style={{ color: "var(--color-field)" }}>
              Scope
            </span>
          </div>
          <div
            className="bg-[var(--color-field)] px-5 py-5 whitespace-pre-wrap"
            style={{ fontFamily: "var(--font-index)", fontSize: 14 }}
          >
            {binder.scope}
          </div>
        </section>
      ) : null}

      <section className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-5 py-3 flex items-center justify-between">
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            Included deadlines
          </span>
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            {String((preview ?? []).length).padStart(2, "0")}
          </span>
        </div>
        {(preview ?? []).length === 0 ? (
          <div className="bg-[var(--color-field)] px-5 py-6">
            <p style={{ fontFamily: "var(--font-index)" }}>
              No matching deadlines yet. If you set an agency filter, only
              deadlines whose governing agency matches will appear.
            </p>
          </div>
        ) : (
          <ul className="bg-[var(--color-field)]">
            {(preview ?? []).map((d, i) => (
              <li
                key={d.id}
                className={
                  i === (preview ?? []).length - 1
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
                      {d.name}
                    </div>
                    <div className="t-utility mt-1">
                      {d.governing_agency ?? "—"} · {d.status}
                      {d.severity_tier ? ` · ${d.severity_tier}` : ""}
                    </div>
                  </div>
                  <div
                    className="font-bold text-[15px]"
                    style={{
                      fontFamily: "var(--font-index)",
                      color: "var(--color-mark)",
                    }}
                  >
                    {d.due_date}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div>
        <LinkButton href="/audit-prep" variant="ghost">
          ← Back to binders
        </LinkButton>
      </div>
    </div>
  );
}
