import Link from "next/link";
import { loadCorrectionQueue, loadCorrectionStats } from "@/lib/admin/data";
import { Body, Caption, H1, Index, Utility } from "@/components/doctrine";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

const STATUSES = ["pending", "accepted", "rejected"] as const;
type Status = (typeof STATUSES)[number];

export default async function AdminCorrectionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const status: Status = STATUSES.find((s) => s === sp.status) ?? "pending";

  const [rows, stats] = await Promise.all([
    loadCorrectionQueue({ status }),
    loadCorrectionStats(),
  ]);

  return (
    <div>
      <header className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 py-5 flex items-end justify-between flex-wrap gap-4">
          <div>
            <Index className="!text-[var(--color-field)] !text-[15px] ">
              CORRECTIONS · QUEUE
            </Index>
            <H1 className="!text-[var(--color-field)] mt-1">RULE CORRECTIONS</H1>
          </div>
          <div className="text-right">
            <Utility className="!text-[var(--color-field)] ">PENDING</Utility>
            <div className="t-display !text-[38px] !text-[var(--color-field)]">
              {stats.pending}
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-field)] px-6 py-4">
          <Caption>
            Accountants on $299 plans flag rules they believe are wrong. Accept
            forks v+1 of the rule via <code>version_regulatory_rule</code> (same
            RPC the admin edit path uses); reject requires a written note. Each
            transition refreshes <code>rule_confidence</code> so the
            business-side badge moves immediately.
          </Caption>
        </div>
        <div className="grid grid-cols-3 divide-x-2 divide-[var(--color-ground)] border-t-2 border-[var(--color-ground)]">
          <StatCell label="PENDING" value={String(stats.pending)} mark={stats.pending > 0} />
          <StatCell label="ACCEPTED" value={String(stats.accepted)} />
          <StatCell label="REJECTED" value={String(stats.rejected)} />
        </div>
      </header>

      <section className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-field)] px-5 py-3 border-b-2 border-[var(--color-ground)] flex items-center gap-2 flex-wrap">
          {STATUSES.map((s) => {
            const active = s === status;
            return (
              <Link
                key={s}
                href={`/admin/corrections?status=${s}`}
                className={`inline-flex items-stretch border-2 ${
                  active
                    ? "border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)]"
                    : "border-[var(--color-ground)]"
                } px-3 py-1.5`}
              >
                <Utility
                  className={
                    active
                      ? "!text-[var(--color-field)]"
                      : ""
                  }
                >
                  {s.toUpperCase()}
                </Utility>
              </Link>
            );
          })}
        </div>
        <table className="w-full bg-[var(--color-field)]">
          <thead className="bg-[var(--color-ground)] text-[var(--color-field)]">
            <tr>
              <Th>SEVERITY</Th>
              <Th>RULE</Th>
              <Th>PROPOSER</Th>
              <Th>RATIONALE</Th>
              <Th>SUBMITTED</Th>
              <Th>{""}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Body className="">No {status} corrections.</Body>
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[var(--color-ground)]">
                <td className="px-4 py-3">
                  <SeverityTag tier={r.rule_severity} />
                </td>
                <td className="px-4 py-3">
                  <Body className="!text-[13px] !font-bold">{r.rule_name}</Body>
                  <Caption className="!text-[11px] !mt-1  font-mono">
                    {r.rule_key} · {r.rule_jurisdiction_type}/{r.rule_jurisdiction_code}
                  </Caption>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="block">{r.proposer_email ?? "(admin)"}</span>
                  <Caption className="!text-[11px] ">{r.proposed_by_kind}</Caption>
                </td>
                <td className="px-4 py-3 text-sm max-w-md">
                  <span className="line-clamp-2">{r.rationale}</span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {new Date(r.created_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/corrections/${r.id}`}
                    className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] px-3 py-1.5 t-utility !text-[12px]"
                  >
                    REVIEW →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatCell({
  label,
  value,
  mark,
}: {
  label: string;
  value: string;
  mark?: boolean;
}) {
  return (
    <div className="px-5 py-5">
      <Utility className=" mb-2">{label}</Utility>
      <div className="t-h1">
        <span className={mark ? "text-[var(--color-mark)]" : ""}>{value}</span>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3">
      <Utility className="!text-[11px] !text-[var(--color-field)]">
        {children}
      </Utility>
    </th>
  );
}

function SeverityTag({
  tier,
}: {
  tier: "critical" | "high" | "medium" | "low" | "info";
}) {
  const color =
    tier === "critical"
      ? "bg-[var(--color-mark)] text-[var(--color-field)]"
      : tier === "high"
        ? "bg-[var(--color-ground)] text-[var(--color-field)]"
        : "bg-[var(--color-field)] text-[var(--color-ground)] border-2 border-[var(--color-ground)]";
  return (
    <span className={`${color} px-2 py-0.5 text-[10px] font-mono uppercase`}>
      {tier}
    </span>
  );
}
