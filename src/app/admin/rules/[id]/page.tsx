import Link from "next/link";
import { notFound } from "next/navigation";
import { loadRegulatoryRule } from "@/lib/admin/data";
import { formatCents } from "@/lib/deadline-utils";
import { Body, Caption, H1, Index, Utility } from "@/components/doctrine";
import VerifyRuleButton from "@/components/admin/VerifyRuleButton";
import RuleEditForm from "@/components/admin/RuleEditForm";

export const dynamic = "force-dynamic";

export default async function AdminRuleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ versioned?: string }>;
}) {
  const { id } = await params;
  const { versioned } = await searchParams;
  const rule = await loadRegulatoryRule(id);
  if (!rule) notFound();

  // The detail view doesn't refuse to render a superseded row — admins should
  // still be able to read history — but it hides the editable form so the
  // chain stays linear (one head per rule_key chain).
  const isSuperseded = Boolean(
    (rule as unknown as { superseded_by?: string | null }).superseded_by
  );
  const supersededBy =
    (rule as unknown as { superseded_by?: string | null }).superseded_by ?? null;

  return (
    <div>
      <Link href="/admin/rules" className="t-utility underline">
        ← BACK TO RULES
      </Link>

      {versioned === "1" && (
        <div className="mt-4 border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-4 py-3">
          <Utility className="!opacity-100 mb-1">VERSIONED</Utility>
          <Body className="!text-[14px]">
            New version saved. This is v{rule.version} — the prior row was
            superseded. Re-verifying the rule is automatic on save.
          </Body>
        </div>
      )}

      {isSuperseded && (
        <div className="mt-4 border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-3">
          <Utility className="!opacity-100 mb-1 !text-[var(--color-field)]">SUPERSEDED</Utility>
          <Body className="!text-[var(--color-field)] !text-[14px]">
            This rule has been superseded by a newer version. Read-only.{" "}
            {supersededBy && (
              <Link href={`/admin/rules/${supersededBy}`} className="underline">
                Open current version →
              </Link>
            )}
          </Body>
        </div>
      )}

      <header className="border-2 border-[var(--color-ground)] mt-4 mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 py-5">
          <Index className="!text-[var(--color-field)] !text-[15px] ">
            RULE · {rule.jurisdiction_type.toUpperCase()} · {rule.jurisdiction_code}
          </Index>
          <H1 className="!text-[var(--color-field)] mt-1">{rule.name}</H1>
          <Caption className="!text-[var(--color-field)]  mt-2 font-mono">
            {rule.rule_key} · v{rule.version}
          </Caption>
        </div>
        <div className="bg-[var(--color-field)] px-6 py-5">
          <Body className="!text-[14px]">{rule.description}</Body>
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-4 mb-6">
        <Panel title="AUTHORITY">
          <DefList
            rows={[
              ["Agency", rule.governing_agency],
              ["Statute", rule.statute_citation ?? "—"],
              [
                "Source",
                rule.source_url ? (
                  <a key="src" href={rule.source_url} target="_blank" className="underline break-all">
                    {rule.source_url}
                  </a>
                ) : (
                  "—"
                ),
              ],
            ]}
          />
        </Panel>
        <Panel title="CADENCE">
          <DefList
            rows={[
              ["Frequency", rule.frequency],
              ["Deadline type", rule.deadline_type],
              ["Severity", rule.severity_tier],
              ["Penalty estimate", rule.penalty_estimate_cents != null ? formatCents(rule.penalty_estimate_cents) : "—"],
            ]}
          />
        </Panel>
        <Panel title="DUE DATE RULE">
          <pre className="font-mono text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(rule.due_date_rule, null, 2)}
          </pre>
        </Panel>
        <Panel title="APPLIES WHEN">
          <pre className="font-mono text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(rule.applies_when, null, 2)}
          </pre>
        </Panel>
      </section>

      <section className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3">
          <Utility className="!text-[var(--color-field)] !opacity-100">VERIFICATION</Utility>
        </div>
        <div className="bg-[var(--color-field)] px-5 py-5">
          <Body className="!text-[14px] mb-4">
            Stamp this rule as having been re-checked against the agency source.
            Updates <code>last_verified_at</code> and writes a{" "}
            <code>platform.rule_verified</code> audit event. Workstream B reads
            this timestamp to compute the user-facing confidence tier (≤30d
            verified, &gt;180d stale, never = unverified).
          </Body>
          <div className="flex items-center gap-4">
            <VerifyRuleButton ruleId={rule.id} />
            <Caption>
              Last verified:{" "}
              {rule.last_verified_at
                ? new Date(rule.last_verified_at).toLocaleString()
                : "never"}
            </Caption>
          </div>
        </div>
      </section>

      {!isSuperseded && (
        <section className="border-2 border-[var(--color-ground)] mb-6">
          <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3">
            <Utility className="!text-[var(--color-field)] !opacity-100">EDIT (CREATES NEW VERSION)</Utility>
          </div>
          <div className="bg-[var(--color-field)] px-5 py-5">
            <Body className="!text-[14px] mb-4">
              Every save creates v{rule.version + 1} and points{" "}
              <code>superseded_by</code> at it. The lookup index excludes
              superseded rows, so new-business seeding immediately reads the
              latest head per rule chain. The runtime in-memory mirror in{" "}
              <code>regulatory-graph.ts</code> still serves today&apos;s
              onboarding flow; <em>edits here</em> propagate the moment that
              switch lands.
            </Body>
            <RuleEditForm
              ruleId={rule.id}
              initial={{
                name: rule.name,
                description: rule.description,
                governing_agency: rule.governing_agency,
                frequency: rule.frequency,
                deadline_type: rule.deadline_type,
                severity_tier: rule.severity_tier,
                penalty_estimate_cents: rule.penalty_estimate_cents,
                source_url: rule.source_url,
                statute_citation: rule.statute_citation,
                effective_date: rule.effective_date,
                sunset_date: rule.sunset_date,
                due_date_rule: rule.due_date_rule,
                applies_when: rule.applies_when,
              }}
            />
          </div>
        </section>
      )}

      <section className="border-2 border-[var(--color-ground)]">
        <div className="bg-[var(--color-field)] px-5 py-3 border-b-2 border-[var(--color-ground)]">
          <Utility>METADATA</Utility>
        </div>
        <div className="bg-[var(--color-field)] px-5 py-4">
          <DefList
            rows={[
              ["Effective date", rule.effective_date],
              ["Sunset date", rule.sunset_date ?? "—"],
              ["Created at", new Date(rule.created_at).toLocaleString()],
              ["Updated at", new Date(rule.updated_at).toLocaleString()],
              ["Industry slug", rule.industry_slug ?? "all"],
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)]">
      <div className="border-b-2 border-[var(--color-ground)] px-4 py-2">
        <Utility>{title}</Utility>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function DefList({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[140px_1fr] gap-y-2 gap-x-3">
      {rows.map(([k, v], i) => (
        <div key={`${k}-${i}`} className="contents">
          <dt>
            <Utility className="">{k}</Utility>
          </dt>
          <dd>
            <Body className="!text-[13px]">{v}</Body>
          </dd>
        </div>
      ))}
    </dl>
  );
}
