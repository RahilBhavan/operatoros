import Link from "next/link";
import {
  loadRegulatoryRules,
  loadRegulatoryRuleStats,
  type RegulatoryRuleRow,
} from "@/lib/admin/data";
import { Body, Caption, H1, Index, Utility } from "@/components/doctrine";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  jurisdiction?: string;
  verification?: string;
}>;

export default async function AdminRulesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const jurisdiction =
    sp.jurisdiction === "federal" || sp.jurisdiction === "state" || sp.jurisdiction === "local"
      ? sp.jurisdiction
      : undefined;
  const verification =
    sp.verification === "verified" ||
    sp.verification === "stale" ||
    sp.verification === "unverified"
      ? sp.verification
      : undefined;

  const [rules, stats] = await Promise.all([
    loadRegulatoryRules({ jurisdiction_type: jurisdiction, verification }),
    loadRegulatoryRuleStats(),
  ]);

  return (
    <div>
      <header className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 py-5 flex items-end justify-between flex-wrap gap-4">
          <div>
            <Index className="!text-[var(--color-field)] !text-[15px] ">
              RULES · GRAPH
            </Index>
            <H1 className="!text-[var(--color-field)] mt-1">REGULATORY RULES</H1>
          </div>
          <div className="text-right">
            <Utility className="!text-[var(--color-field)] ">CANONICAL ROWS</Utility>
            <div className="t-display !text-[38px] !text-[var(--color-field)]">{stats.total}</div>
          </div>
        </div>
        <div className="bg-[var(--color-field)] px-6 py-4">
          <Caption>
            The canonical regulatory rule graph. Source of truth for the
            corrections loop. The seed engine still runs from the in-memory
            mirror in <code>regulatory-graph.ts</code> — verification here
            updates last-verified-at (read by Workstream B confidence tiers)
            but doesn&apos;t change new-business seeding until the runtime
            switch lands.
          </Caption>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x-2 divide-y-2 md:divide-y-0 divide-[var(--color-ground)] border-t-2 border-[var(--color-ground)]">
          <StatCell label="FEDERAL" value={String(stats.by_jurisdiction.federal)} />
          <StatCell label="STATE" value={String(stats.by_jurisdiction.state)} />
          <StatCell label="LOCAL" value={String(stats.by_jurisdiction.local)} />
          <StatCell
            label="VERIFIED ≤30D"
            value={String(stats.verified_recent)}
            sub={`${stats.unverified} unverified · ${stats.stale} stale`}
          />
          <StatCell
            label="COVERAGE GAPS"
            value={String(stats.missing_states.length)}
            sub="states with no state-level rule"
            mark={stats.missing_states.length > 0}
          />
        </div>
      </header>

      {stats.missing_states.length > 0 && (
        <section className="border-2 border-[var(--color-ground)] mb-6">
          <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-5 py-3">
            <Utility className="!text-[var(--color-field)]">
              50-STATE COVERAGE GAPS
            </Utility>
          </div>
          <div className="bg-[var(--color-field)] px-5 py-4">
            <Body className="!text-[14px]">
              States with no rules in <code>regulatory_rules</code>:
            </Body>
            <div className="flex flex-wrap gap-2 mt-3">
              {stats.missing_states.map((s) => (
                <span
                  key={s}
                  className="border-2 border-[var(--color-ground)] bg-[var(--color-mark)] text-[var(--color-field)] px-2 py-1 font-mono text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-field)] px-5 py-3 border-b-2 border-[var(--color-ground)]">
          <form className="flex flex-wrap gap-3 items-end" action="/admin/rules">
            <FilterSelect
              name="jurisdiction"
              label="JURISDICTION"
              current={jurisdiction ?? ""}
              options={[
                { value: "", label: "All" },
                { value: "federal", label: "Federal" },
                { value: "state", label: "State" },
                { value: "local", label: "Local" },
              ]}
            />
            <FilterSelect
              name="verification"
              label="VERIFICATION"
              current={verification ?? ""}
              options={[
                { value: "", label: "All" },
                { value: "verified", label: "Verified ≤30d" },
                { value: "stale", label: "Stale >180d" },
                { value: "unverified", label: "Unverified" },
              ]}
            />
            <button
              type="submit"
              className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] px-4 py-2 t-utility"
            >
              APPLY
            </button>
            <Link
              href="/admin/rules"
              className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-4 py-2 t-utility"
            >
              RESET
            </Link>
          </form>
        </div>
        <table className="w-full bg-[var(--color-field)]">
          <thead className="bg-[var(--color-ground)] text-[var(--color-field)]">
            <tr>
              <Th>RULE KEY</Th>
              <Th>NAME</Th>
              <Th>JURISDICTION</Th>
              <Th>INDUSTRY</Th>
              <Th>SEV</Th>
              <Th>VERIFIED</Th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Body className="">No rules match. Try resetting filters.</Body>
                </td>
              </tr>
            )}
            {rules.map((r) => (
              <tr key={r.id} className="border-t border-[var(--color-ground)]">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/rules/${r.id}`} className="underline">
                    {r.rule_key}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Body className="!text-[14px]">{r.name}</Body>
                  <Caption className="!text-[11px] ">{r.governing_agency}</Caption>
                </td>
                <td className="px-4 py-3 text-sm">
                  <code className="text-xs">{r.jurisdiction_type}</code>
                  <div className="font-mono text-xs">{r.jurisdiction_code}</div>
                </td>
                <td className="px-4 py-3 text-sm">{r.industry_slug ?? "—"}</td>
                <td className="px-4 py-3">
                  <SeverityTag tier={r.severity_tier} />
                </td>
                <td className="px-4 py-3 text-xs">{formatVerified(r)}</td>
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
  sub,
  mark,
}: {
  label: string;
  value: string;
  sub?: string;
  mark?: boolean;
}) {
  return (
    <div className="px-5 py-5">
      <Utility className=" mb-2">{label}</Utility>
      <div className="t-h1">
        <span className={mark ? "text-[var(--color-mark)]" : ""}>{value}</span>
      </div>
      {sub && <Caption className="!text-[12px] !mt-1">{sub}</Caption>}
    </div>
  );
}

function FilterSelect({
  name,
  label,
  current,
  options,
}: {
  name: string;
  label: string;
  current: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <Utility className="">{label}</Utility>
      <select
        name={name}
        defaultValue={current}
        className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-3 py-2 t-body"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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

function SeverityTag({ tier }: { tier: RegulatoryRuleRow["severity_tier"] }) {
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

function formatVerified(r: RegulatoryRuleRow): string {
  if (!r.last_verified_at) return "—";
  const days = Math.floor(
    (Date.now() - new Date(r.last_verified_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 180) return `${days}d ago`;
  return `${days}d ago (stale)`;
}
