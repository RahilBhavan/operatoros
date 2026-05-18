import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import IssueCoiForm from "@/components/coi/IssueCoiForm";

export const dynamic = "force-dynamic";

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CoiRecipientDetail({
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

  const { data: recipient } = await supabase
    .from("coi_recipients")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!recipient) notFound();

  const { data: issues } = await supabase
    .from("coi_issues")
    .select("id, effective_date, expiry_date, delivery_channel, issued_at, notes")
    .eq("recipient_id", id)
    .order("expiry_date", { ascending: false });

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb
        items={[
          { label: "COI", href: "/coi" },
          { label: "Recipients", href: "/coi" },
          { label: recipient.name },
        ]}
      />
      <header className="border-b-4 border-[var(--color-ground)] pb-3">
        <div className="t-utility mb-2">PA-COI · {id.slice(0, 6).toUpperCase()}</div>
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
          {recipient.name}
        </h1>
        <div className="t-utility mt-3">
          {recipient.email ?? "no email"}
          {recipient.recurring ? " · recurring" : ""}
        </div>
      </header>

      {recipient.requirements ? (
        <section className="border-2 border-[var(--color-ground)]">
          <div className="panel-ink px-4 py-2">
            <span className="t-utility" style={{ color: "var(--color-field)" }}>
              Required coverage
            </span>
          </div>
          <div
            className="bg-[var(--color-field)] px-4 py-3 whitespace-pre-wrap"
            style={{ fontFamily: "var(--font-index)", fontSize: 14 }}
          >
            {recipient.requirements}
          </div>
        </section>
      ) : null}

      <section className="border-2 border-[var(--color-ground)]">
        <div className="panel-ink px-4 py-2 flex items-center justify-between">
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            Issued certificates
          </span>
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            {String((issues ?? []).length).padStart(2, "0")}
          </span>
        </div>
        {(issues ?? []).length === 0 ? (
          <div className="bg-[var(--color-field)] px-5 py-6">
            <p style={{ fontFamily: "var(--font-index)" }}>
              Nothing issued yet to this recipient. Use the form below to log
              an issuance.
            </p>
          </div>
        ) : (
          <ul className="bg-[var(--color-field)]">
            {(issues ?? []).map((it, i) => (
              <li
                key={it.id}
                className={
                  i === (issues ?? []).length - 1
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
                      Effective {formatDate(it.effective_date)} → expires{" "}
                      {formatDate(it.expiry_date)}
                    </div>
                    <div className="t-utility mt-1">
                      Issued {formatDate(it.issued_at.slice(0, 10))} ·{" "}
                      {it.delivery_channel}
                      {it.notes ? ` · ${it.notes}` : ""}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <IssueCoiForm recipientId={id} />

      <div>
        <LinkButton href="/coi" variant="ghost">
          ← Back to recipients
        </LinkButton>
      </div>
    </div>
  );
}
