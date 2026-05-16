import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCorrection, loadRegulatoryRule } from "@/lib/admin/data";
import { Body, Caption, H1, Index, Utility } from "@/components/doctrine";
import CorrectionReviewActions from "@/components/admin/CorrectionReviewActions";

export const dynamic = "force-dynamic";

export default async function AdminCorrectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const correction = await loadCorrection(id);
  if (!correction) notFound();

  const rule = await loadRegulatoryRule(correction.rule_id);

  // Diff visualisation: pair every changed field with its current value.
  const diffRows = rule
    ? Object.entries(correction.proposed_changes).map(([key, proposed]) => {
        const current = (rule as unknown as Record<string, unknown>)[key];
        return { key, current, proposed };
      })
    : [];

  const isResolved = correction.status !== "pending";

  return (
    <div>
      <Link href="/admin/corrections" className="t-utility underline">
        ← BACK TO CORRECTIONS
      </Link>

      <header className="border-2 border-[var(--color-ground)] mt-4 mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 py-5">
          <Index className="!text-[var(--color-field)] !text-[15px] opacity-80">
            CORRECTION · {correction.status.toUpperCase()}
          </Index>
          <H1 className="!text-[var(--color-field)] mt-1">{correction.rule_name}</H1>
          <Caption className="!text-[var(--color-field)] !opacity-80 mt-2 font-mono">
            {correction.rule_key} · {correction.rule_jurisdiction_type}/
            {correction.rule_jurisdiction_code} · proposed{" "}
            {new Date(correction.created_at).toLocaleString()}
          </Caption>
        </div>
        <div className="bg-[var(--color-field)] px-6 py-4">
          <DefList
            rows={[
              ["Proposer", correction.proposer_email ?? "—"],
              ["Kind", correction.proposed_by_kind],
              [
                "Status",
                <span key="s" className="font-mono uppercase">
                  {correction.status}
                </span>,
              ],
              [
                "Resulting rule",
                correction.resulting_rule_id ? (
                  <Link
                    key="rr"
                    href={`/admin/rules/${correction.resulting_rule_id}`}
                    className="underline"
                  >
                    {correction.resulting_rule_id.slice(0, 8)}…
                  </Link>
                ) : (
                  "—"
                ),
              ],
              [
                "Source rule",
                <Link
                  key="sr"
                  href={`/admin/rules/${correction.rule_id}`}
                  className="underline"
                >
                  open →
                </Link>,
              ],
            ]}
          />
        </div>
      </header>

      <section className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3">
          <Utility className="!text-[var(--color-field)] !opacity-100">RATIONALE</Utility>
        </div>
        <div className="bg-[var(--color-field)] px-5 py-4">
          <Body className="!text-[14px] whitespace-pre-wrap">{correction.rationale}</Body>
          {correction.citation_url && (
            <Caption className="!mt-3">
              Citation:{" "}
              <a
                href={correction.citation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                {correction.citation_url}
              </a>
            </Caption>
          )}
        </div>
      </section>

      <section className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3">
          <Utility className="!text-[var(--color-field)] !opacity-100">
            PROPOSED CHANGES ({diffRows.length})
          </Utility>
        </div>
        <div className="bg-[var(--color-field)]">
          {diffRows.length === 0 ? (
            <Body className="px-5 py-4 opacity-60">
              No structured changes parsed — rationale-only correction.
            </Body>
          ) : (
            <table className="w-full">
              <thead className="bg-[var(--color-field-soft)]">
                <tr>
                  <Th>FIELD</Th>
                  <Th>CURRENT</Th>
                  <Th>PROPOSED</Th>
                </tr>
              </thead>
              <tbody>
                {diffRows.map(({ key, current, proposed }) => (
                  <tr key={key} className="border-t border-[var(--color-ground)]">
                    <td className="px-4 py-3 font-mono text-xs align-top">{key}</td>
                    <td className="px-4 py-3 align-top text-sm">
                      <Code value={current} />
                    </td>
                    <td className="px-4 py-3 align-top text-sm bg-[var(--color-field-soft)]">
                      <Code value={proposed} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {!isResolved && (
        <section className="border-2 border-[var(--color-ground)] mb-6">
          <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3">
            <Utility className="!text-[var(--color-field)] !opacity-100">REVIEW</Utility>
          </div>
          <div className="bg-[var(--color-field)] px-5 py-5">
            <CorrectionReviewActions correctionId={correction.id} />
          </div>
        </section>
      )}

      {isResolved && correction.review_note && (
        <section className="border-2 border-[var(--color-ground)]">
          <div className="bg-[var(--color-field)] px-5 py-3 border-b-2 border-[var(--color-ground)]">
            <Utility>REVIEWER NOTE</Utility>
          </div>
          <div className="bg-[var(--color-field)] px-5 py-4">
            <Body className="!text-[14px] whitespace-pre-wrap">
              {correction.review_note}
            </Body>
            <Caption className="!mt-2 opacity-60 !text-[11px]">
              {correction.reviewed_at
                ? new Date(correction.reviewed_at).toLocaleString()
                : ""}
            </Caption>
          </div>
        </section>
      )}
    </div>
  );
}

function Code({ value }: { value: unknown }) {
  if (value === undefined) return <span className="opacity-60">undefined</span>;
  if (value === null) return <span className="opacity-60">—</span>;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <span className="break-words">{String(value)}</span>;
  }
  return (
    <pre className="font-mono text-xs whitespace-pre-wrap break-words">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3">
      <Utility className="!text-[11px] !text-[var(--color-ground)] !opacity-100">
        {children}
      </Utility>
    </th>
  );
}

function DefList({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[140px_1fr] gap-y-2 gap-x-3">
      {rows.map(([k, v], i) => (
        <div key={`${k}-${i}`} className="contents">
          <dt>
            <Utility className="opacity-60">{k}</Utility>
          </dt>
          <dd>
            <Body className="!text-[13px]">{v}</Body>
          </dd>
        </div>
      ))}
    </dl>
  );
}
