import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ExternalLink } from "lucide-react";
import { loadShareViewByToken } from "@/lib/security/share-by-token";
import {
  computeAutoStatus,
  computeRiskWeightedScore,
  computeExposureCents,
  formatCents,
} from "@/lib/deadline-utils";
import {
  TagCard,
  H2,
  Body,
  Caption,
  Utility,
  Index,
} from "@/components/doctrine";
import { PublicNav } from "@/components/marketing/PublicNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

type SeverityTier = "critical" | "high" | "medium" | "low" | "info";

const STATUS_LABEL: Record<string, string> = {
  overdue: "OVERDUE",
  in_progress: "DUE SOON",
  upcoming: "UPCOMING",
  compliant: "COMPLIANT",
};

const SEVERITY_LETTER: Record<SeverityTier, string> = {
  critical: "X",
  high: "A",
  medium: "B",
  low: "C",
  info: "C",
};

export default async function SharePage({
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

  const data = await loadShareViewByToken(token, { ip, userAgent });
  if (!data) notFound();

  const { business, deadlines, expires_at: expiresAt, label } = data;

  const rows = deadlines.map((d) => ({
    ...d,
    computed: computeAutoStatus({ due_date: d.due_date, status: d.status }),
  }));

  const overdueRows = rows.filter((d) => d.computed === "overdue");
  const inProgressRows = rows.filter((d) => d.computed === "in_progress");
  const upcomingRows = rows.filter((d) => d.computed === "upcoming");
  const compliantRows = rows.filter((d) => d.computed === "compliant");

  const score = computeRiskWeightedScore(rows);
  const exposure = computeExposureCents(rows);

  const generatedAt = new Date();
  const tokenSuffix = token.slice(-6).toUpperCase();
  const businessCode = business.id.slice(0, 6).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--color-field)]">
      <PublicNav caption="Shared view · Read-only" />

      <main className="max-w-[1100px] mx-auto px-6 py-10">
        {/* Hero luggage tag */}
        <TagCard
          variant="ground"
          destination={
            <span className="block uppercase break-words">{business.name}</span>
          }
          subtitle="AUDIT-READY"
          topCode={`PA-${tokenSuffix}`}
          topRight="FINAL DESTINATION"
          tabLabel="AUDIT"
          sortSymbol="A"
          refNumber={
            <>
              {generatedAt
                .toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
                .replace(/\//g, ".")}
              {" · "}
              {businessCode}
            </>
          }
          perforated
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Utility className="">SHARE LABEL</Utility>
              <Body className="!font-bold !mt-1">
                {label ?? "Compliance Overview"}
              </Body>
            </div>
            <div className="text-right">
              <Utility className="">EXPIRES</Utility>
              <Index className="!text-[19px] !text-[var(--color-ground)] block mt-1">
                {new Date(expiresAt)
                  .toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                  .replace(/\//g, ".")}
              </Index>
            </div>
          </div>
        </TagCard>

        {/* SECTION 01 — SCORE */}
        <SectionHeader index="01" title="RISK-WEIGHTED SCORE" sort="A" />
        <section className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-[var(--color-ground)]">
            <div className="px-6 py-6">
              <Utility className=" mb-3">SCORE</Utility>
              <div className="t-display !text-[75px] !leading-none">
                <span
                  className={
                    score >= 80
                      ? ""
                      : score >= 60
                      ? ""
                      : "text-[var(--color-mark)]"
                  }
                >
                  {score}
                </span>
                <span className="t-h2  ml-1">/100</span>
              </div>
            </div>
            <div className="px-6 py-6">
              <Utility className=" mb-3">ESTIMATED EXPOSURE</Utility>
              <Index className="!text-[38px] !leading-none block">
                {exposure > 0 ? formatCents(exposure) : "$0"}
              </Index>
              <Caption className="!mt-2 !text-[12px]">
                {exposure > 0
                  ? "BASED ON STATUTORY SCHEDULES"
                  : "NO EXPOSURE ON RECORD"}
              </Caption>
            </div>
            <div className="px-6 py-6">
              <Utility className=" mb-3">DEADLINE TALLY</Utility>
              <div className="grid grid-cols-3 gap-3">
                <Tally
                  label="OVERDUE"
                  value={overdueRows.length}
                  mark={overdueRows.length > 0}
                />
                <Tally label="DUE SOON" value={inProgressRows.length} />
                <Tally label="COMPLIANT" value={compliantRows.length} />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 02 — OVERDUE */}
        {overdueRows.length > 0 && (
          <>
            <SectionHeader index="02" title="OVERDUE" sort="X" mark />
            <DeadlineTable rows={overdueRows} statusKey="overdue" />
          </>
        )}

        {/* SECTION 03 — DUE WITHIN 30 DAYS */}
        {inProgressRows.length > 0 && (
          <>
            <SectionHeader index="03" title="DUE WITHIN 30 DAYS" sort="A" />
            <DeadlineTable rows={inProgressRows} statusKey="in_progress" />
          </>
        )}

        {/* SECTION 04 — UPCOMING */}
        {upcomingRows.length > 0 && (
          <>
            <SectionHeader index="04" title="UPCOMING" sort="B" />
            <DeadlineTable rows={upcomingRows} statusKey="upcoming" />
          </>
        )}

        {/* SECTION 05 — COMPLIANT */}
        {compliantRows.length > 0 && (
          <>
            <SectionHeader index="05" title="COMPLIANT" sort="C" />
            <DeadlineTable rows={compliantRows} statusKey="compliant" />
          </>
        )}

        {rows.length === 0 && (
          <section className="border-2 border-[var(--color-ground)] py-16 px-6 text-center mb-10">
            <Index className="!text-[48px]  block mb-3">000</Index>
            <H2>No deadlines to display.</H2>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t-2 border-[var(--color-ground)] pt-6 mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Utility className="">GENERATED</Utility>
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
              <Utility className="">TOKEN</Utility>
              <Index className="!text-[19px] !text-[var(--color-ground)] block mt-1">
                {tokenSuffix}
              </Index>
            </div>
            <div className="text-right">
              <Caption className="">
                Generated by{" "}
                <a
                  href={process.env.NEXT_PUBLIC_APP_URL ?? "/"}
                  className="t-link"
                >
                  OperatorOS
                </a>
                {" · operatoros.com"}
              </Caption>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

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
    <div className="flex items-center justify-between mt-10 mb-3 gap-3 flex-wrap">
      <div className="flex items-baseline gap-3">
        <Index
          className={`!text-[19px] ${
            mark ? "" : "!text-[var(--color-ground)]"
          }`}
        >
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

function Tally({
  label,
  value,
  mark,
}: {
  label: string;
  value: number;
  mark?: boolean;
}) {
  return (
    <div>
      <Utility className=" !text-[12px]">{label}</Utility>
      <div
        className={`t-h1 !text-[30px] !leading-none mt-1 ${
          mark ? "text-[var(--color-mark)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DeadlineTable({
  rows,
  statusKey,
}: {
  rows: Array<{
    id: string;
    name: string;
    due_date: string;
    governing_agency: string | null;
    deadline_type: string | null;
    source_url: string | null;
    severity_tier: string | null;
    statute_citation: string | null;
    computed: string;
  }>;
  statusKey: "overdue" | "in_progress" | "upcoming" | "compliant";
}) {
  const overdue = statusKey === "overdue";
  return (
    <section
      className={`border-2 mb-8 ${
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
          <Index className="!text-[var(--color-field)] !text-[12px] ">
            ({rows.length})
          </Index>
        </div>
        <Utility className="!text-[var(--color-field)]  !text-[12px]">
          DEADLINE · AGENCY · SEVERITY
        </Utility>
      </header>
      <ul className="bg-[var(--color-field)] divide-y divide-[var(--color-ground)]">
        {rows.map((d) => {
          const severity = (d.severity_tier ?? "medium") as SeverityTier;
          return (
            <li
              key={d.id}
              className="flex items-center justify-between px-5 py-4 gap-4"
            >
              <div className="min-w-0 flex-1">
                <Body className="!font-bold truncate flex items-center gap-2">
                  {d.name}
                  {d.source_url && (
                    <a
                      href={d.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=" hover:opacity-100 hover:text-[var(--color-mark)] transition-opacity"
                      aria-label="source"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </Body>
                <Caption className="!mt-1 !text-[12px]">
                  {(d.governing_agency ?? d.deadline_type ?? "").toUpperCase()}
                  {d.statute_citation ? ` · ${d.statute_citation}` : ""}
                </Caption>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Index
                  className={
                    overdue ? "" : "!text-[var(--color-ground)]"
                  }
                >
                  {new Date(d.due_date)
                    .toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                    .replace(/\//g, ".")}
                </Index>
                <span className="inline-flex items-stretch border-2 border-[var(--color-ground)]">
                  <span className="px-2 py-0.5 border-r-2 border-[var(--color-ground)] t-utility !text-[12px]">
                    SEV
                  </span>
                  <span className="px-2 py-0.5 t-h3 !text-[15px] leading-none">
                    {SEVERITY_LETTER[severity]}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
