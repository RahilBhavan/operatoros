import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { ListRow } from "@/components/doctrine/ListRow";
import { PageEmptyState } from "@/components/doctrine/PageEmptyState";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";

export const dynamic = "force-dynamic";

type Recipient = {
  id: string;
  name: string;
  email: string | null;
  recurring: boolean;
};

type Issue = {
  id: string;
  recipient_id: string;
  expiry_date: string;
  issued_at: string;
};

function coiStatusLabel(
  latest: Issue | undefined,
  nowMs: number,
): string {
  const e = latest?.expiry_date;
  if (!e) return "Never issued";
  const ms = new Date(e).getTime() - nowMs;
  if (ms < 0) return "Expired";
  if (ms < 30 * 86400 * 1000) return "Expiring ≤30d";
  return "Current";
}

export default async function CoiIndex() {
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

  const { data: recipients } = await supabase
    .from("coi_recipients")
    .select("id, name, email, recurring")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  const { data: issues } = await supabase
    .from("coi_issues")
    .select("id, recipient_id, expiry_date, issued_at")
    .eq("business_id", business.id)
    .order("expiry_date", { ascending: true });

  const issuesByRecipient = new Map<string, Issue[]>();
  for (const it of (issues ?? []) as Issue[]) {
    const arr = issuesByRecipient.get(it.recipient_id) ?? [];
    arr.push(it);
    issuesByRecipient.set(it.recipient_id, arr);
  }

  const recipientRows = (recipients ?? []) as Recipient[];
  const nowMs = Date.now();

  return (
    <PageShell>
      <PageHeader
        code={`${recipientRows.length} recipient${recipientRows.length === 1 ? "" : "s"}`}
        title="COI distribution"
        description="Manage certificates of insurance for every GC, owner, HOA, or property manager that requests one. Track expiry and re-issue without chasing your broker."
        actions={
          <LinkButton href="/coi/recipients/new" variant="mark">
            + Add recipient
          </LinkButton>
        }
      />

      {recipientRows.length === 0 ? (
        <PageEmptyState
          title="No recipients yet"
          description="Add the GCs, property managers, or HOAs that regularly request your COI. We'll track expiry and remind you before each one lapses."
          actions={
            <LinkButton href="/coi/recipients/new" variant="mark">
              + Add first recipient
            </LinkButton>
          }
        />
      ) : (
        <PageSection title="Recipients" count={recipientRows.length}>
          <ul className="bg-[var(--color-field)]">
            {recipientRows.map((r, i) => {
              const latest = issuesByRecipient.get(r.id)?.[
                (issuesByRecipient.get(r.id)?.length ?? 0) - 1
              ];
              const status = coiStatusLabel(latest, nowMs);
              const isUrgent = status === "Expired" || status === "Expiring ≤30d";

              return (
                <li
                  key={r.id}
                  className={
                    i === recipientRows.length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <ListRow
                    href={`/coi/recipients/${r.id}`}
                    primary={r.name}
                    secondary={`${r.email ?? "No email"}${r.recurring ? " · Recurring" : ""}`}
                    trailing={
                      <span
                        className={
                          isUrgent ? "text-[var(--color-mark)]" : undefined
                        }
                      >
                        {status}
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
