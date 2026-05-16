import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { ExternalLink } from "lucide-react";
import {
  computeAutoStatus,
  computeRiskWeightedScore,
  computeExposureCents,
  formatCents,
} from "@/lib/deadline-utils";
import { loadAccountantPortalByToken } from "@/lib/security/accountant-by-token";
import type { Database } from "@/types/supabase";
import {
  TagCard,
  H2,
  Body,
  Caption,
  Utility,
  Index,
} from "@/components/doctrine";
import DeadlineNote from "./DeadlineNote";
import FlagRuleButton from "./FlagRuleButton";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// Match the augmented row in accountant-by-token.ts — supabase types
// haven't regenerated since Workstream A added regulatory_rule_id.
type Deadline = Database["public"]["Tables"]["deadlines"]["Row"] & {
  regulatory_rule_id?: string | null;
};

type StatusKey = "overdue" | "in_progress" | "upcoming" | "compliant";

const STATUS_LABEL: Record<StatusKey, string> = {
  overdue: "OVERDUE — ACTION REQUIRED",
  in_progress: "DUE WITHIN 30 DAYS",
  upcoming: "UPCOMING",
  compliant: "COMPLIANT",
};

const STATUS_SORT: Record<StatusKey, string> = {
  overdue: "X",
  in_progress: "A",
  upcoming: "B",
  compliant: "C",
};

export default async function AccountantPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const userAgent = hdrs.get("user-agent");

  const payload = await loadAccountantPortalByToken(token, { ip, userAgent });
  if (!payload) notFound();

  const {
    connection,
    business,
    deadlines: allDeadlines,
    portfolio,
    noteByDeadlineId,
  } = payload;

  const notesByDeadline = new Map<string, string>(
    Object.entries(noteByDeadlineId),
  );

  const score = computeRiskWeightedScore(allDeadlines);
  const exposure = computeExposureCents(allDeadlines);

  const overdue = allDeadlines.filter((d) => computeAutoStatus(d) === "overdue");
  const inProgress = allDeadlines.filter(
    (d) => computeAutoStatus(d) === "in_progress",
  );
  const upcoming = allDeadlines.filter(
    (d) => computeAutoStatus(d) === "upcoming",
  );
  const compliant = allDeadlines.filter((d) => d.status === "compliant");

  const generatedAt = new Date();
  const tokenSuffix = token.slice(-6).toUpperCase();
  const businessCode = business.id.slice(0, 6).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--color-field)]">
      <PublicNav expiresAt={connection.expires_at} />

      <main className="max-w-[1100px] mx-auto px-6 py-10">
        {/* Hero — accountant tag (red / mark variant for VIP access) */}
        <TagCard
          variant="mark"
          destination={<span className="block uppercase">ACCOUNTANT.</span>}
          subtitle="PORTFOLIO"
          topCode="A-200"
          topRight="VERIFIED ACCESS"
          tabLabel="CPA"
          sortSymbol="B"
          refNumber={`PA-${tokenSuffix}`}
          perforated
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Utility className="opacity-60">VIEWING</Utility>
              <Body className="!font-bold !mt-1 uppercase">
                {business.name}
              </Body>
            </div>
            <div className="text-right">
              <Utility className="opacity-60">CLIENTS IN VIEW</Utility>
              <Index className="!text-[24px] !text-[var(--color-ground)] block mt-1">
                {portfolio.length + 1}
              </Index>
            </div>
          </div>
        </TagCard>

        {/* Portfolio panel — list of other clients */}
        {portfolio.length > 0 && (
          <>
            <SectionHeader
              index="00"
              title={`YOUR PORTFOLIO (${portfolio.length + 1} CLIENTS)`}
              sort="P"
            />
            <section className="border-2 border-[var(--color-ground)] mb-10">
              <header className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                <Utility className="!text-[var(--color-field)] !opacity-100">
                  TOTAL EXPOSURE ACROSS PORTFOLIO
                </Utility>
                <Index className="!text-[var(--color-field)] !text-[15px]">
                  {formatCents(
                    portfolio.reduce((s, p) => s + p.exposure_cents, 0) +
                      exposure,
                  )}
                </Index>
              </header>
              <ul className="bg-[var(--color-field)] divide-y divide-[var(--color-ground)]">
                {portfolio.map((c) => (
                  <li key={c.token}>
                    <Link
                      href={`/accountant/${c.token}`}
                      className="flex items-center gap-5 px-5 py-4 hover:bg-[var(--color-field-soft)] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <Body className="!font-bold truncate uppercase">
                          {c.business_name}
                        </Body>
                        <Caption className="!mt-1 !text-[12px]">
                          {c.overdue_count} OVERDUE
                        </Caption>
                      </div>
                      <div className="shrink-0 text-right">
                        <Utility className="opacity-60 !text-[12px]">
                          SCORE
                        </Utility>
                        <Index
                          className={`!text-[19px] block ${
                            c.score >= 80 ? "!text-[var(--color-ground)]" : ""
                          }`}
                        >
                          {c.score}
                        </Index>
                      </div>
                      <div className="shrink-0 text-right w-28">
                        <Utility className="opacity-60 !text-[12px]">
                          EXPOSURE
                        </Utility>
                        <Index className="!text-[15px] block">
                          {formatCents(c.exposure_cents)}
                        </Index>
                      </div>
                      <Utility className="opacity-60 shrink-0">→</Utility>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {/* Business identity strip */}
        <div className="border-2 border-[var(--color-ground)] mb-10">
          <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between gap-2 flex-wrap">
            <Utility className="!text-[var(--color-field)] !opacity-100">
              CLIENT MANIFEST
            </Utility>
            <Index className="!text-[var(--color-field)] !text-[12px] opacity-80">
              PA-{businessCode}
            </Index>
          </div>
          <div className="bg-[var(--color-field)] px-5 py-4">
            <H2 className="uppercase">{business.name}</H2>
            <Caption className="!mt-2 !text-[12px]">
              {business.entity_type
                ? business.entity_type.replace(/_/g, " ").toUpperCase()
                : "ENTITY UNKNOWN"}
              {business.employee_count
                ? ` · ${business.employee_count} EMPLOYEES`
                : ""}
              {" · SHARED "}
              {new Date(connection.created_at)
                .toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
                .replace(/\//g, ".")}
            </Caption>
          </div>
        </div>

        {/* SCORE STRIP */}
        <SectionHeader index="01" title="RISK-WEIGHTED SCORE" sort="A" />
        <section className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-[var(--color-ground)]">
            <ScoreCell
              label="SCORE"
              value={`${score}`}
              suffix="/100"
              big
              extra={
                exposure > 0 ? (
                  <Caption className="!text-[var(--color-mark)] !text-[12px] !mt-1">
                    {formatCents(exposure)} exposure
                  </Caption>
                ) : null
              }
            />
            <ScoreCell
              label="OVERDUE"
              value={`${overdue.length}`}
              mark={overdue.length > 0}
            />
            <ScoreCell label="DUE SOON" value={`${inProgress.length}`} />
            <ScoreCell label="COMPLIANT" value={`${compliant.length}`} />
          </div>
        </section>

        {/* Deadline groups */}
        {allDeadlines.length === 0 ? (
          <section className="border-2 border-[var(--color-ground)] py-16 px-6 text-center mb-10">
            <Index className="!text-[48px] opacity-30 block mb-3">000</Index>
            <H2>No deadlines on record.</H2>
          </section>
        ) : (
          <div className="flex flex-col gap-10">
            {overdue.length > 0 && (
              <div>
                <SectionHeader index="02" title="OVERDUE" sort="X" mark />
                <DeadlineGroup
                  deadlines={overdue}
                  statusKey="overdue"
                  token={token}
                  notesByDeadline={notesByDeadline}
                />
              </div>
            )}
            {inProgress.length > 0 && (
              <div>
                <SectionHeader
                  index="03"
                  title="DUE WITHIN 30 DAYS"
                  sort="A"
                />
                <DeadlineGroup
                  deadlines={inProgress}
                  statusKey="in_progress"
                  token={token}
                  notesByDeadline={notesByDeadline}
                />
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <SectionHeader index="04" title="UPCOMING" sort="B" />
                <DeadlineGroup
                  deadlines={upcoming}
                  statusKey="upcoming"
                  token={token}
                  notesByDeadline={notesByDeadline}
                />
              </div>
            )}
            {compliant.length > 0 && (
              <div>
                <SectionHeader index="05" title="COMPLIANT" sort="C" />
                <DeadlineGroup
                  deadlines={compliant}
                  statusKey="compliant"
                  token={token}
                  notesByDeadline={notesByDeadline}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="border-t-2 border-[var(--color-ground)] pt-6 mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Utility className="opacity-60">GENERATED</Utility>
              <Index className="!text-[19px] !text-[var(--color-ground)] block mt-1">
                {generatedAt
                  .toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                  .replace(/\//g, ".")}
              </Index>
            </div>
            <div className="text-center">
              <Utility className="opacity-60">TOKEN</Utility>
              <Index className="!text-[19px] !text-[var(--color-ground)] block mt-1">
                {tokenSuffix}
              </Index>
            </div>
            <div className="text-right max-w-md">
              <Caption className="!opacity-70">
                Notes are private to this accountant view. Compliance data is
                auto-generated based on business profile and is for reference
                only. OperatorOS does not provide legal, tax, or accounting
                advice.
              </Caption>
            </div>
          </div>
          <Caption className="!opacity-60 !text-[12px] mt-3 text-center">
            Generated by{" "}
            <Link href="/" className="t-link">
              OperatorOS
            </Link>
            {" · operatoros.com"}
          </Caption>
        </footer>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PublicNav({ expiresAt }: { expiresAt: string }) {
  return (
    <nav className="border-b-2 border-[var(--color-ground)] bg-[var(--color-field)] px-6 py-4">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="t-h3 font-black tracking-tight">
          OPERATOR<span className="text-[var(--color-mark)]">OS</span>
        </Link>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <Utility className="opacity-60">
            ACCOUNTANT PORTAL · READ-ONLY
          </Utility>
          <span className="inline-flex items-stretch border-2 border-[var(--color-ground)]">
            <span className="px-2 py-0.5 border-r-2 border-[var(--color-ground)] t-utility !text-[12px]">
              EXPIRES
            </span>
            <span className="px-2 py-0.5 t-utility !text-[12px]">
              {new Date(expiresAt)
                .toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
                .replace(/\//g, ".")}
            </span>
          </span>
        </div>
      </div>
    </nav>
  );
}

function SectionHeader({
  index,
  title,
  sort,
  mark,
}: {
  index: string;
  title: string;
  sort: string;
  mark?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-2 mb-3 gap-3 flex-wrap">
      <div className="flex items-baseline gap-3">
        <Index className="!text-[19px] !text-[var(--color-mark)]">
          SECTION {index}
        </Index>
        <Utility className={mark ? "!text-[var(--color-mark)]" : ""}>
          {" · "}
          {title}
        </Utility>
      </div>
      <span className="inline-flex items-stretch border-2 border-[var(--color-ground)]">
        <span className="px-2 py-0.5 border-r-2 border-[var(--color-ground)] t-utility !text-[12px]">
          SORT
        </span>
        <span className="px-2 py-0.5 t-h3 leading-none">{sort}</span>
      </span>
    </div>
  );
}

function ScoreCell({
  label,
  value,
  suffix,
  extra,
  big,
  mark,
}: {
  label: string;
  value: string;
  suffix?: string;
  extra?: React.ReactNode;
  big?: boolean;
  mark?: boolean;
}) {
  return (
    <div className="px-5 py-5">
      <Utility className="opacity-60 mb-2">{label}</Utility>
      <div className={big ? "t-display !text-[38px]" : "t-h1"}>
        <span className={mark ? "text-[var(--color-mark)]" : ""}>{value}</span>
        {suffix && <span className="t-h3 !opacity-50 ml-1">{suffix}</span>}
      </div>
      {extra}
    </div>
  );
}

function DeadlineGroup({
  deadlines,
  statusKey,
  token,
  notesByDeadline,
}: {
  deadlines: Deadline[];
  statusKey: StatusKey;
  token: string;
  notesByDeadline: Map<string, string>;
}) {
  const overdue = statusKey === "overdue";
  return (
    <section
      className={`border-2 ${
        overdue
          ? "border-[var(--color-mark)]"
          : "border-[var(--color-ground)]"
      }`}
    >
      <header
        className={`flex items-center justify-between px-5 py-3 ${
          overdue
            ? "bg-[var(--color-mark)] text-[var(--color-field)]"
            : "bg-[var(--color-ground)] text-[var(--color-field)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <Utility className="!text-[var(--color-field)] !opacity-100">
            {STATUS_LABEL[statusKey]}
          </Utility>
          <Index className="!text-[var(--color-field)] !text-[12px] opacity-80">
            ({deadlines.length})
          </Index>
        </div>
        <span className="inline-flex items-stretch border-2 border-[var(--color-field)]">
          <span className="px-2 py-0.5 border-r-2 border-[var(--color-field)] t-utility !text-[12px]">
            SORT
          </span>
          <span className="px-2 py-0.5 t-h3 leading-none">
            {STATUS_SORT[statusKey]}
          </span>
        </span>
      </header>
      <ul className="bg-[var(--color-field)] divide-y divide-[var(--color-ground)]">
        {deadlines.map((d) => (
          <li key={d.id} className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Body className="!font-bold truncate flex items-center gap-2">
                  {d.name}
                  {d.source_url && (
                    <a
                      href={d.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-70 hover:opacity-100 hover:text-[var(--color-mark)] transition-opacity"
                      aria-label="source"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </Body>
                {d.governing_agency && (
                  <Caption className="!mt-1 !text-[12px]">
                    {d.governing_agency.toUpperCase()}
                  </Caption>
                )}
              </div>
              <Index
                className={`shrink-0 ${
                  overdue ? "" : "!text-[var(--color-ground)]"
                }`}
              >
                {new Date(d.due_date)
                  .toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                  .replace(/\//g, ".")}
              </Index>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <FlagRuleButton
                token={token}
                ruleId={d.regulatory_rule_id ?? null}
                ruleName={d.name}
              />
            </div>
            <DeadlineNote
              deadlineId={d.id}
              token={token}
              existingNote={notesByDeadline.get(d.id) ?? null}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
