import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";
import { Body } from "@/components/doctrine/Typography";
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

  const issueRows = issues ?? [];

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: "COI", href: "/coi" },
          { label: recipient.name },
        ]}
      />

      <PageHeader
        title={recipient.name}
        meta={`${recipient.email ?? "No email"}${recipient.recurring ? " · Sends COI on each renewal" : ""}`}
        actions={
          <LinkButton href={`/coi/recipients/${id}/edit`} variant="ghost" size="sm">
            Edit →
          </LinkButton>
        }
      />

      {recipient.requirements ? (
        <PageSection title="Required coverage">
          <Body className="bg-[var(--color-field)] px-4 py-3 whitespace-pre-wrap">
            {recipient.requirements}
          </Body>
        </PageSection>
      ) : null}

      <PageSection title="Issued certificates" count={issueRows.length}>
        {issueRows.length === 0 ? (
          <Body className="bg-[var(--color-field)] px-5 py-6">
            Nothing issued yet to this recipient. Use the form below to log an
            issuance.
          </Body>
        ) : (
          <ul className="bg-[var(--color-field)]">
            {issueRows.map((it, i) => (
              <li
                key={it.id}
                className={
                  i === issueRows.length - 1
                    ? ""
                    : "border-b border-[var(--color-ground)]"
                }
              >
                <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3">
                  <div>
                    <Body className="font-bold">
                      Effective {formatDate(it.effective_date)} → expires{" "}
                      {formatDate(it.expiry_date)}
                    </Body>
                    <p className="t-utility mt-1">
                      Issued {formatDate(it.issued_at.slice(0, 10))} ·{" "}
                      {it.delivery_channel}
                      {it.notes ? ` · ${it.notes}` : ""}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <IssueCoiForm recipientId={id} />

      <LinkButton href="/coi" variant="ghost">
        ← Back to recipients
      </LinkButton>
    </PageShell>
  );
}
