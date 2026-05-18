import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeAutoStatus,
  computeRiskWeightedScore,
  computeExposureCents,
  formatCents,
  topActions,
} from "@/lib/deadline-utils";
import PlanTierForceForm from "@/components/admin/PlanTierForceForm";
import RevokeShareTokenButton from "@/components/admin/RevokeShareTokenButton";
import RevokeAccountantConnectionButton from "@/components/admin/RevokeAccountantConnectionButton";
import {
  Body,
  Caption,
  Destination,
  H2,
  Index,
  Utility,
} from "@/components/doctrine";

export const dynamic = "force-dynamic";

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!business) notFound();

  const [
    { data: owner },
    { data: deadlines },
    { data: shareTokens },
    { data: accountants },
    { data: members },
    { data: locs },
    { data: events },
  ] = await Promise.all([
    supabase.auth.admin.getUserById(business.owner_id),
    supabase
      .from("deadlines")
      .select(
        "id, name, due_date, status, severity_tier, penalty_estimate_cents, governing_agency"
      )
      .eq("business_id", business.id)
      .order("due_date", { ascending: true }),
    supabase
      .from("share_tokens")
      // token column dropped in 20260517000002_audit_remediation.
      .select(
        "id, label, expires_at, view_count, last_viewed_at, revoked_at, created_at"
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("accountant_connections")
      .select(
        "id, accountant_email, accountant_name, created_at, expires_at, revoked_at, last_accessed_at"
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("memberships")
      .select(
        "id, user_id, role, status, invited_email, created_at, accepted_at, invite_expires_at"
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: true }),
    supabase.from("locations").select("state, city").eq("business_id", business.id),
    supabase
      .from("audit_events")
      .select("id, event_type, actor_user_id, metadata, occurred_at")
      .eq("business_id", business.id)
      .order("occurred_at", { ascending: false })
      .limit(20),
  ]);

  const renderedAt = new Date();
  const ds = deadlines ?? [];
  const score = computeRiskWeightedScore(ds);
  const exposure = computeExposureCents(ds);
  const overdue = ds.filter(
    (d) =>
      computeAutoStatus({ due_date: d.due_date, status: d.status }) === "overdue"
  ).length;
  const top3 = topActions(ds, 3);

  const businessIdShort = business.id.slice(0, 6).toUpperCase();
  const createdDate = new Date(business.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <Link
        href="/admin/businesses"
        className="t-utility hover:text-[var(--color-mark)] inline-flex items-center gap-1 mb-3"
      >
        ← ALL BUSINESSES
      </Link>

      {/* Master tag — the business identity card */}
      <header className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 pt-5 pb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <Index className="!text-[var(--color-field)] !text-[15px] ">
              PA-{businessIdShort}
            </Index>
            <span className="tag-tab -mt-6">ADMIN</span>
            <Utility className="">
              CREATED · {createdDate.toUpperCase()}
            </Utility>
          </div>
          <Utility className="!text-[var(--color-field)]  mb-2">
            FINAL DESTINATION
          </Utility>
          <Destination className="!text-[var(--color-field)] !text-[60px] !leading-[0.95]">
            {business.name.toUpperCase()}
          </Destination>
          <H2 className="!text-[var(--color-field)]  mt-2 !text-[19px]">
            {business.plan_tier.toUpperCase()} ·{" "}
            {business.billing_status.toUpperCase()}
          </H2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
            <Meta label="OWNER" value={owner?.user?.email ?? "—"} />
            <Meta label="ENTITY" value={business.entity_type ?? "—"} />
            <Meta label="STATE" value={locs?.[0]?.state ?? "—"} />
            <Meta label="INDUSTRY" value={business.industry_slug ?? "—"} />
            <Meta
              label="EMPLOYEES"
              value={String(business.employee_count ?? "—")}
            />
          </div>
        </div>

        {/* Score strip */}
        <div className="bg-[var(--color-field)] grid grid-cols-2 lg:grid-cols-4 divide-x-2 divide-y-2 lg:divide-y-0 divide-[var(--color-ground)]">
          <StatCell
            label="RISK SCORE"
            value={`${score}`}
            suffix="/100"
            sub={`${ds.length} deadlines`}
            big
          />
          <StatCell
            label="OVERDUE"
            value={`${overdue}`}
            sub="immediate action surface"
            mark={overdue > 0}
          />
          <StatCell
            label="EXPOSURE"
            value={formatCents(exposure)}
            sub="penalty $ at risk"
            mark={exposure > 0}
          />
          <StatCell
            label="PLAN"
            value={business.plan_tier.toUpperCase()}
            sub={`${business.billing_status}${
              business.trial_ends_at
                ? ` · trial ends ${new Date(
                    business.trial_ends_at
                  ).toLocaleDateString("en-US")}`
                : ""
            }`}
          />
        </div>
      </header>

      <section className="grid lg:grid-cols-3 gap-4 mb-6">
        <CardPanel
          title="ADMIN ACTIONS · FORCE OVERRIDE"
          subtitle="Logged to audit_events"
        >
          <PlanTierForceForm
            businessId={business.id}
            currentTier={business.plan_tier}
            currentStatus={business.billing_status}
          />
        </CardPanel>

        <CardPanel
          title="TOP 3 ACTIONS · SCORE RECOVERY"
          className="lg:col-span-2"
        >
          {top3.length === 0 ? (
            <Caption className="">
              No overdue or due-soon items right now.
            </Caption>
          ) : (
            <ol className="flex flex-col divide-y-2 divide-[var(--color-ground)]">
              {top3.map((a, i) => (
                <li
                  key={a.id ?? a.name}
                  className="flex items-center gap-4 py-3"
                >
                  <Index className="!text-[24px] shrink-0 w-10">
                    {String(i + 1).padStart(2, "0")}
                  </Index>
                  <div className="min-w-0 flex-1">
                    <Body className="!font-bold truncate">{a.name}</Body>
                    <Caption className="!mt-1 !text-[12px]">
                      {a.status === "overdue" ? "OVERDUE" : "DUE SOON"} ·{" "}
                      {a.severity_tier?.toUpperCase()}
                      {a.penalty_estimate_cents > 0 ? (
                        <>
                          {" "}
                          ·{" "}
                          <Index className="!text-[12px]">
                            {formatCents(a.penalty_estimate_cents)}
                          </Index>{" "}
                          POTENTIAL
                        </>
                      ) : null}
                    </Caption>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardPanel>
      </section>

      <SectionTable
        title={`SHARE LINKS (${shareTokens?.length ?? 0})`}
        headers={["LABEL", "STATE", "EXPIRES", "VIEWS", ""]}
        align={["left", "left", "left", "right", "right"]}
        empty={(shareTokens ?? []).length === 0 ? "No share links." : null}
      >
        {(shareTokens ?? []).map((t) => (
          <tr
            key={t.id}
            className="border-t-2 border-[var(--color-ground)]"
          >
            <td className="px-5 py-3">
              <Body className="!font-bold !text-[15px]">
                {t.label ?? "—"}
              </Body>
            </td>
            <td className="px-5 py-3">
              <StatePill
                kind={
                  t.revoked_at
                    ? "revoked"
                    : new Date(t.expires_at).getTime() < renderedAt.getTime()
                      ? "expired"
                      : "active"
                }
              />
            </td>
            <td className="px-5 py-3">
              <Index className="!text-[12px]">
                {new Date(t.expires_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Index>
            </td>
            <td className="px-5 py-3 text-right">
              <Index className="!text-[15px]">{t.view_count}</Index>
            </td>
            <td className="px-5 py-3 text-right">
              {!t.revoked_at && <RevokeShareTokenButton tokenId={t.id} />}
            </td>
          </tr>
        ))}
      </SectionTable>

      <SectionTable
        title={`ACCOUNTANT CONNECTIONS (${accountants?.length ?? 0})`}
        headers={["ACCOUNTANT", "STATE", "EXPIRES", "LAST ACCESS", ""]}
        align={["left", "left", "left", "left", "right"]}
        empty={
          (accountants ?? []).length === 0 ? "No accountants connected." : null
        }
      >
        {(accountants ?? []).map((ac) => (
          <tr key={ac.id} className="border-t-2 border-[var(--color-ground)]">
            <td className="px-5 py-3">
              <Body className="!font-bold !text-[15px]">
                {ac.accountant_name ?? "—"}
              </Body>
              <Caption className="!text-[12px]  !mt-0">
                {ac.accountant_email}
              </Caption>
            </td>
            <td className="px-5 py-3">
              <StatePill
                kind={
                  ac.revoked_at
                    ? "revoked"
                    : new Date(ac.expires_at).getTime() < renderedAt.getTime()
                      ? "expired"
                      : "active"
                }
              />
            </td>
            <td className="px-5 py-3">
              <Index className="!text-[12px]">
                {new Date(ac.expires_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Index>
            </td>
            <td className="px-5 py-3">
              <Index className="!text-[12px]">
                {ac.last_accessed_at
                  ? new Date(ac.last_accessed_at).toLocaleDateString("en-US")
                  : "—"}
              </Index>
            </td>
            <td className="px-5 py-3 text-right">
              {!ac.revoked_at && (
                <RevokeAccountantConnectionButton connectionId={ac.id} />
              )}
            </td>
          </tr>
        ))}
      </SectionTable>

      <SectionTable
        title={`TEAM MEMBERS (${members?.length ?? 0})`}
        headers={["MEMBER", "ROLE", "STATUS", "JOINED / INVITED"]}
        align={["left", "left", "left", "left"]}
        empty={(members ?? []).length === 0 ? "No memberships." : null}
      >
        {(members ?? []).map((m) => (
          <tr key={m.id} className="border-t-2 border-[var(--color-ground)]">
            <td className="px-5 py-3">
              <Body className="!text-[15px]">
                {m.invited_email ?? m.user_id.slice(0, 8)}
              </Body>
            </td>
            <td className="px-5 py-3">
              <Utility className="!text-[12px]">{m.role}</Utility>
            </td>
            <td className="px-5 py-3">
              <Utility className="!text-[12px]">{m.status}</Utility>
            </td>
            <td className="px-5 py-3">
              <Index className="!text-[12px]">
                {(m.accepted_at ?? m.created_at) &&
                  new Date(
                    m.accepted_at ?? m.created_at
                  ).toLocaleDateString("en-US")}
              </Index>
            </td>
          </tr>
        ))}
      </SectionTable>

      <section className="mb-6">
        <SectionHeader title={`RECENT ACTIVITY (${events?.length ?? 0})`} />
        <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] divide-y-2 divide-[var(--color-ground)]">
          {(events ?? []).length === 0 && (
            <div className="px-5 py-8 text-center">
              <Caption className="">No events.</Caption>
            </div>
          )}
          {(events ?? []).map((e) => (
            <div
              key={e.id}
              className="px-5 py-3 flex items-center justify-between gap-3"
            >
              <span className="inline-flex items-center border-2 border-[var(--color-ground)] px-2 py-0.5 t-utility !text-[12px] bg-[var(--color-field)] text-[var(--color-ground)]">
                {e.event_type}
              </span>
              <Index className="!text-[12px]">
                {new Date(e.occurred_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Index>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <Utility className="!text-[var(--color-field)]  !text-[12px]">
        {label}
      </Utility>
      <Caption className="!text-[var(--color-field)]  !text-[12px]">
        {value}
      </Caption>
    </div>
  );
}

function StatCell({
  label,
  value,
  suffix,
  sub,
  big,
  mark,
}: {
  label: string;
  value: string;
  suffix?: string;
  sub: string;
  big?: boolean;
  mark?: boolean;
}) {
  return (
    <div className="px-5 py-5">
      <Utility className=" mb-2">{label}</Utility>
      <div className={big ? "t-display !text-[38px]" : "t-h1"}>
        <span className={mark ? "text-[var(--color-mark)]" : ""}>{value}</span>
        {suffix && <span className="t-h3  ml-1">{suffix}</span>}
      </div>
      <Caption className="!text-[12px] !mt-1">{sub}</Caption>
    </div>
  );
}

function CardPanel({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border-2 border-[var(--color-ground)] bg-[var(--color-field)] ${
        className ?? ""
      }`}
    >
      <div className="border-b-2 border-[var(--color-ground)] px-5 py-3">
        <Utility>{title}</Utility>
        {subtitle && (
          <Caption className="!text-[12px]  !mt-0.5">
            {subtitle}
          </Caption>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-3 border-b-2 border-[var(--color-ground)] pb-2">
      <Utility>{title}</Utility>
    </div>
  );
}

function SectionTable({
  title,
  headers,
  align,
  empty,
  children,
}: {
  title: string;
  headers: string[];
  align: Array<"left" | "right">;
  empty: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <SectionHeader title={title} />
      <div className="border-2 border-[var(--color-ground)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ground)] text-[var(--color-field)]">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-5 py-3 t-utility !text-[var(--color-field)] !text-[12px] ${
                    align[i] === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--color-field)]">
            {empty ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center">
                  <Caption className="">{empty}</Caption>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatePill({ kind }: { kind: "active" | "revoked" | "expired" }) {
  const base =
    "inline-flex items-center border-2 px-2 py-0.5 t-utility !text-[12px]";
  if (kind === "revoked") {
    return (
      <span
        className={`${base} border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)]`}
      >
        REVOKED
      </span>
    );
  }
  if (kind === "expired") {
    return (
      <span
        className={`${base} border-[var(--color-ground)] bg-transparent text-[var(--color-ground)] `}
      >
        EXPIRED
      </span>
    );
  }
  return (
    <span
      className={`${base} border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)]`}
    >
      ACTIVE
    </span>
  );
}
