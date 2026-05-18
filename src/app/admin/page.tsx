import Link from "next/link";
import { formatCents } from "@/lib/deadline-utils";
import {
  loadKpis,
  loadBusinessSummaries,
  loadAuditStream,
  loadNetworkDensity,
} from "@/lib/admin/data";
import { Body, Caption, H1, Index, Utility } from "@/components/doctrine";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [kpis, recentBiz, recentEvents, network] = await Promise.all([
    loadKpis(),
    loadBusinessSummaries().then((rows) => rows.slice(0, 5)),
    loadAuditStream(10),
    loadNetworkDensity(),
  ]);

  // "Acquisition mix" = share of all top-of-funnel that converted to a
  // business profile. Not the same as Stripe-true paying conversion.
  const acquisitionMixPct =
    kpis.total_businesses + kpis.total_waitlist > 0
      ? Math.round(
          (kpis.total_businesses / (kpis.total_businesses + kpis.total_waitlist)) * 100
        )
      : 0;
  // Paying conversion = share of businesses on a paying plan + active status.
  const payingConvPct =
    kpis.total_businesses > 0
      ? Math.round((kpis.paying / kpis.total_businesses) * 100)
      : 0;

  return (
    <div>
      {/* Master header — control tower readout */}
      <header className="border-2 border-[var(--color-ground)] mb-8">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 pt-5 pb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <Index className="!text-[var(--color-field)] !text-[15px] ">
              OPS · OVERVIEW
            </Index>
            <span className="tag-tab -mt-6">ADMIN</span>
            <Utility className="">SECTOR · TOWER</Utility>
          </div>
          <H1 className="!text-[var(--color-field)]">PLATFORM OVERVIEW</H1>
          <Caption className="!text-[var(--color-field)]  mt-2">
            Live operational state of OperatorOS. Numbers refresh on every page load.
          </Caption>
        </div>

        {/* Primary KPI strip */}
        <div className="bg-[var(--color-field)] grid grid-cols-2 lg:grid-cols-4 divide-x-2 divide-y-2 lg:divide-y-0 divide-[var(--color-ground)]">
          <StatCell
            label="MRR (PLAN × COUNT)"
            value={formatCents(kpis.mrr_cents)}
            sub={`${kpis.paying} paying · ${kpis.trialing} trialing`}
            big
          />
          <StatCell
            label="BUSINESSES"
            value={String(kpis.total_businesses)}
            sub={`+${kpis.signups_last_7d} in last 7 days`}
          />
          <StatCell
            label="WAITLIST"
            value={String(kpis.total_waitlist)}
            sub={`${kpis.waitlist_uninvited} not yet invited`}
          />
          <StatCell
            label="PAYING CONVERSION"
            value={`${payingConvPct}%`}
            sub={`${kpis.paying}/${kpis.total_businesses} · acq mix ${acquisitionMixPct}%`}
          />
        </div>
      </header>

      {/* Risk strip — red-leaning */}
      <section className="border-2 border-[var(--color-ground)] mb-8">
        <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <Utility className="!text-[var(--color-field)] !opacity-100">
            OPERATIONAL EXPOSURE
          </Utility>
          <Caption className="!text-[var(--color-field)]  !text-[12px]">
            FAILURE SURFACES
          </Caption>
        </div>
        <div className="bg-[var(--color-field)] grid grid-cols-2 lg:grid-cols-4 divide-x-2 divide-y-2 lg:divide-y-0 divide-[var(--color-ground)]">
          <StatCell
            label="DEADLINES TRACKED"
            value={kpis.total_deadlines.toLocaleString("en-US")}
            sub={`${kpis.overdue_deadlines} overdue across tenants`}
            mark={kpis.overdue_deadlines > 0}
          />
          <StatCell
            label="CUSTOMER EXPOSURE"
            value={formatCents(kpis.total_exposure_cents)}
            sub="Overdue + due-soon penalty sum"
            mark={kpis.total_exposure_cents > 0}
          />
          <StatCell
            label="PAST DUE SUBS"
            value={String(kpis.past_due)}
            sub="Recovery surface — chase first"
            mark={kpis.past_due > 0}
          />
          <StatCell
            label="RECENT EVENTS"
            value={String(recentEvents.length)}
            sub="In last query window"
          />
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mb-8">
        <CardPanel title="PLAN DISTRIBUTION">
          {Object.entries(kpis.by_plan).length === 0 ? (
            <Caption className="">No businesses yet.</Caption>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--color-ground)]">
              {Object.entries(kpis.by_plan).map(([tier, count]) => (
                <li key={tier} className="flex items-center justify-between py-2">
                  <Body className="!font-bold uppercase">{tier}</Body>
                  <Index className="!text-[19px]">{count}</Index>
                </li>
              ))}
            </ul>
          )}
        </CardPanel>

        <CardPanel title="TOP WAITLIST STATES">
          {kpis.top_states.length === 0 ? (
            <Caption className="">
              No state-tagged signups yet.
            </Caption>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--color-ground)]">
              {kpis.top_states.map(({ state, count }) => (
                <li
                  key={state}
                  className="flex items-center justify-between py-2 gap-3"
                >
                  <Body className="!font-bold">{state}</Body>
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="w-32 h-2 border border-[var(--color-ground)]">
                      <div
                        className="h-full bg-[var(--color-ground)]"
                        style={{
                          width: `${(count / (kpis.top_states[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <Index className="!text-[15px] w-8 text-right">{count}</Index>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardPanel>

        <CardPanel title="NETWORK DENSITY · COHORTS ≥ 10">
          {network.cohorts_at_threshold === 0 ? (
            <Caption className="">
              No (industry × state) cohort has yet crossed the 10-business
              k-anonymity threshold. Peer benchmarks are dark on the dashboard
              until then.
            </Caption>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 border-2 border-[var(--color-ground)]">
                <div className="px-4 py-3 border-r-2 border-[var(--color-ground)]">
                  <Utility className=" mb-1 !text-[12px]">
                    COHORTS
                  </Utility>
                  <Index className="!text-[19px]">
                    {network.cohorts_at_threshold}
                  </Index>
                </div>
                <div className="px-4 py-3">
                  <Utility className=" mb-1 !text-[12px]">
                    BUSINESSES COVERED
                  </Utility>
                  <Index className="!text-[19px]">
                    {network.businesses_covered.toLocaleString("en-US")}
                  </Index>
                </div>
              </div>
              <ul className="flex flex-col divide-y divide-[var(--color-ground)]">
                {network.top_cohorts.map((c) => (
                  <li
                    key={`${c.industry_slug}-${c.state_code}`}
                    className="flex items-center justify-between py-2 gap-3"
                  >
                    <Body className="!font-bold !text-[15px] truncate">
                      {c.state_code} · {c.industry_slug}
                    </Body>
                    <Index className="!text-[15px] w-10 text-right">
                      {c.cohort_size}
                    </Index>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardPanel>
      </section>

      {/* Newest businesses */}
      <section className="mb-8">
        <SectionHeader
          title="NEWEST BUSINESSES"
          href="/admin/businesses"
          linkText="SEE ALL →"
        />
        <div className="border-2 border-[var(--color-ground)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-ground)] text-[var(--color-field)]">
              <tr>
                <Th>BUSINESS</Th>
                <Th>OWNER</Th>
                <Th>PLAN</Th>
                <Th align="right">SCORE</Th>
                <Th align="right">EXPOSURE</Th>
              </tr>
            </thead>
            <tbody className="bg-[var(--color-field)]">
              {recentBiz.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <Caption className="">No businesses yet.</Caption>
                  </td>
                </tr>
              )}
              {recentBiz.map((b) => (
                <tr
                  key={b.id}
                  className="border-t-2 border-[var(--color-ground)]"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/businesses/${b.id}`}
                      className="t-link !no-underline hover:!text-[var(--color-mark)]"
                    >
                      <Body className="!font-bold">{b.name}</Body>
                    </Link>
                    <Caption className="!text-[12px]  !mt-0">
                      {b.state ?? "—"} · {b.industry_slug ?? "—"} ·{" "}
                      {b.entity_type ?? "—"}
                    </Caption>
                  </td>
                  <td className="px-5 py-3">
                    <Caption className="!text-[12px] truncate max-w-[180px] !mt-0">
                      {b.owner_email ?? "—"}
                    </Caption>
                  </td>
                  <td className="px-5 py-3">
                    <PlanPill tier={b.plan_tier} status={b.billing_status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Index className="!text-[19px]">{b.risk_weighted_score}</Index>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Index
                      className={`!text-[15px] ${b.exposure_cents > 0 ? "" : ""}`}
                    >
                      {formatCents(b.exposure_cents)}
                    </Index>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <SectionHeader
          title="RECENT ACTIVITY"
          href="/admin/audit"
          linkText="OPEN AUDIT →"
        />
        <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] divide-y-2 divide-[var(--color-ground)]">
          {recentEvents.length === 0 && (
            <div className="px-5 py-10 text-center">
              <Caption className="">No audit events yet.</Caption>
            </div>
          )}
          {recentEvents.map((e) => (
            <div
              key={e.id}
              className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="flex items-center gap-3 min-w-0">
                <EventTag type={e.event_type} />
                <Body className="!text-[15px] truncate">
                  {e.business_name ?? "—"}
                </Body>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {e.actor_email && (
                  <Caption className="!text-[12px] ">
                    {e.actor_email}
                  </Caption>
                )}
                <Index className="!text-[12px]">
                  {new Date(e.occurred_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Index>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
  big,
  mark,
}: {
  label: string;
  value: string;
  sub: string;
  big?: boolean;
  mark?: boolean;
}) {
  return (
    <div className="px-5 py-5">
      <Utility className=" mb-2">{label}</Utility>
      <div className={big ? "t-display !text-[38px]" : "t-h1"}>
        <span className={mark ? "text-[var(--color-mark)]" : ""}>{value}</span>
      </div>
      <Caption className="!text-[12px] !mt-1">{sub}</Caption>
    </div>
  );
}

function CardPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)]">
      <div className="border-b-2 border-[var(--color-ground)] px-5 py-3">
        <Utility>{title}</Utility>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  linkText,
}: {
  title: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3 border-b-2 border-[var(--color-ground)] pb-2">
      <Utility>{title}</Utility>
      <Link
        href={href}
        className="t-utility hover:text-[var(--color-mark)]"
      >
        {linkText}
      </Link>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 t-utility !text-[var(--color-field)] !text-[12px] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function PlanPill({ tier, status }: { tier: string; status: string }) {
  const isPastDue = status === "past_due";
  const isActive = status === "active" || status === "trialing";

  const base =
    "inline-flex items-center border-2 px-2 py-0.5 t-utility !text-[12px]";

  if (isPastDue) {
    return (
      <span
        className={`${base} border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)]`}
      >
        {tier} · {status}
      </span>
    );
  }
  if (isActive) {
    return (
      <span
        className={`${base} border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)]`}
      >
        {tier} · {status}
      </span>
    );
  }
  return (
    <span
      className={`${base} border-[var(--color-ground)] bg-transparent text-[var(--color-ground)]`}
    >
      {tier} · {status}
    </span>
  );
}

function EventTag({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center border-2 border-[var(--color-ground)] px-2 py-0.5 t-utility !text-[12px] bg-[var(--color-field)] text-[var(--color-ground)]">
      {type}
    </span>
  );
}
