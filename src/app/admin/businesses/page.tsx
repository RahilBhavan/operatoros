import Link from "next/link";
import { loadBusinessSummaries } from "@/lib/admin/data";
import { formatCents } from "@/lib/deadline-utils";
import { Body, Button, Caption, H1, Index, Utility } from "@/components/doctrine";

export const dynamic = "force-dynamic";

const PLAN_TIERS = ["free", "business", "accountant"] as const;
const BILLING_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "inactive",
] as const;

const PLAN_SORT_SYMBOL: Record<string, string> = {
  business: "B",
  accountant: "A",
  free: "X",
};

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan_tier?: string;
    billing_status?: string;
    state?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;
  const filter = {
    plan_tier: PLAN_TIERS.find((t) => t === sp.plan_tier) as
      | "free"
      | "business"
      | "accountant"
      | undefined,
    billing_status: sp.billing_status,
    state: sp.state,
    search: sp.q,
  };
  const rows = await loadBusinessSummaries(filter);

  return (
    <div>
      <header className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 py-5 flex items-end justify-between flex-wrap gap-4">
          <div>
            <Index className="!text-[var(--color-field)] !text-[15px] ">
              BUSINESSES · ALL TENANTS
            </Index>
            <H1 className="!text-[var(--color-field)] mt-1">BUSINESSES</H1>
          </div>
          <div className="text-right">
            <Utility className="!text-[var(--color-field)] ">
              ROSTER
            </Utility>
            <div className="t-display !text-[38px] !text-[var(--color-field)]">
              {rows.length}
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-field)] px-6 py-4">
          <Caption>
            Every tenant on OperatorOS. Click a row for the full record + actions.
          </Caption>
        </div>
      </header>

      <form
        className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-4 mb-6 flex flex-wrap items-end gap-3"
        action="/admin/businesses"
      >
        <label className="flex-1 min-w-[200px] flex flex-col gap-1">
          <Utility className="!text-[12px]">SEARCH</Utility>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="business name"
            className="t-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <Utility className="!text-[12px]">PLAN</Utility>
          <select
            name="plan_tier"
            defaultValue={sp.plan_tier ?? ""}
            className="t-input"
          >
            <option value="">ALL</option>
            {PLAN_TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <Utility className="!text-[12px]">STATUS</Utility>
          <select
            name="billing_status"
            defaultValue={sp.billing_status ?? ""}
            className="t-input"
          >
            <option value="">ANY</option>
            {BILLING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <Utility className="!text-[12px]">STATE</Utility>
          <input
            name="state"
            defaultValue={sp.state ?? ""}
            placeholder="XX"
            maxLength={2}
            className="t-input w-24 uppercase"
          />
        </label>
        <Button type="submit" variant="ground">
          APPLY →
        </Button>
        {(sp.q || sp.plan_tier || sp.billing_status || sp.state) && (
          <Link
            href="/admin/businesses"
            className="t-utility hover:text-[var(--color-mark)] self-end pb-3"
          >
            CLEAR
          </Link>
        )}
      </form>

      <div className="border-2 border-[var(--color-ground)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ground)] text-[var(--color-field)]">
            <tr>
              <Th>BUSINESS</Th>
              <Th>OWNER</Th>
              <Th>SORT</Th>
              <Th>STATUS</Th>
              <Th align="right">SCORE</Th>
              <Th align="right">OVERDUE</Th>
              <Th align="right">EXPOSURE</Th>
              <Th>CREATED</Th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-field)]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center">
                  <Caption className="">
                    No businesses match these filters.
                  </Caption>
                </td>
              </tr>
            )}
            {rows.map((b) => {
              const sortLetter = PLAN_SORT_SYMBOL[b.plan_tier] ?? "X";
              return (
                <tr
                  key={b.id}
                  className="border-t-2 border-[var(--color-ground)] hover:bg-[var(--color-field)]"
                >
                  <td className="px-5 py-3 align-top">
                    <Link
                      href={`/admin/businesses/${b.id}`}
                      className="t-link !no-underline hover:!text-[var(--color-mark)]"
                    >
                      <Body className="!font-bold">{b.name}</Body>
                    </Link>
                    <Caption className="!text-[12px]  !mt-0">
                      {b.state ?? "—"} · {b.industry_slug ?? "—"} ·{" "}
                      {b.entity_type ?? "—"} ·{" "}
                      {b.employee_count ? `${b.employee_count} emp` : "—"}
                    </Caption>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <Caption className="!text-[12px] truncate max-w-[180px] !mt-0">
                      {b.owner_email ?? "—"}
                    </Caption>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <span className="inline-flex items-center justify-center w-9 h-9 border-2 border-[var(--color-ground)] t-h3 leading-none">
                      {sortLetter}
                    </span>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <PlanPill tier={b.plan_tier} status={b.billing_status} />
                  </td>
                  <td className="px-5 py-3 text-right align-top">
                    <Index
                      className={`!text-[19px] ${
                        b.risk_weighted_score < 60
                          ? "!text-[var(--color-mark)]"
                          : ""
                      }`}
                    >
                      {b.risk_weighted_score}
                    </Index>
                  </td>
                  <td className="px-5 py-3 text-right align-top">
                    <Index
                      className={`!text-[15px] ${
                        b.overdue_count > 0
                          ? "!text-[var(--color-mark)]"
                          : ""
                      }`}
                    >
                      {b.overdue_count}
                    </Index>
                  </td>
                  <td className="px-5 py-3 text-right align-top">
                    <Index
                      className={`!text-[15px] ${
                        b.exposure_cents > 0 ? "" : ""
                      }`}
                    >
                      {formatCents(b.exposure_cents)}
                    </Index>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <Index className="!text-[12px]">
                      {new Date(b.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Index>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
