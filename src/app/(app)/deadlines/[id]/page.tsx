import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MarkCompliantButton from "@/components/dashboard/MarkCompliantButton";
import DocumentUpload from "@/components/dashboard/DocumentUpload";
import FileItForMeCta from "@/components/dashboard/FileItForMeCta";
import {
  matchFilingKind,
  FILING_CATALOG,
  isFilingsConfigured,
} from "@/lib/filings";
import type { Database } from "@/types/supabase";
import { LinkButton } from "@/components/doctrine/Button";
import { StampChip } from "@/components/doctrine/StampChip";
import { PanAmTag } from "@/components/doctrine/PanAmTag";
import { panAmPropsForDeadline } from "@/lib/pan-am-tag";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];

type StatusKey = Deadline["status"];

const STATUS_CHIP: Record<StatusKey, "mark" | "ground" | "field"> = {
  overdue: "mark",
  in_progress: "ground",
  upcoming: "field",
  compliant: "field",
};

const STATUS_LABEL: Record<StatusKey, string> = {
  overdue: "Overdue",
  in_progress: "Due ≤ 30d",
  upcoming: "Upcoming",
  compliant: "Compliant",
};

const FREQ_LABELS: Record<string, string> = {
  annual: "Annual",
  biennial: "Every 2 years",
  quarterly: "Quarterly",
  one_time: "One-time",
};

const TYPE_CODE: Record<string, string> = {
  tax: "TAX",
  business_license: "LIC",
  employee_cert: "CRT",
  coi: "COI",
  entity_filing: "ENT",
  equipment_inspection: "INS",
  other: "OPS",
};

function formatPenalty(cents: number | null): string | null {
  if (cents == null || cents <= 0) return null;
  const dollars = cents / 100;
  return dollars >= 1000
    ? `$${Math.round(dollars).toLocaleString("en-US")}`
    : `$${dollars.toFixed(2)}`;
}

export default async function DeadlineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: deadline } = await supabase
    .from("deadlines")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!deadline) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("deadline_id", id)
    .order("uploaded_at", { ascending: false });

  const due = new Date(deadline.due_date);
  const dueLong = due.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const dueShort = due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const typeCode = TYPE_CODE[deadline.deadline_type] ?? "OPS";
  const isOverdue = deadline.status === "overdue";
  const isUrgent = isOverdue || deadline.status === "in_progress";
  const penalty = formatPenalty(deadline.penalty_estimate_cents);
  const idCode = deadline.id.slice(0, 8).toUpperCase();

  return (
    <div className="flex flex-col gap-8">
      {/* Crumb */}
      <div className="t-utility text-[var(--color-ground)]">
        <Link href="/deadlines" className="t-link">
          ← Deadlines
        </Link>
        {" · "}Detail · PA-DL-{idCode}
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
        {/* Left: the destination card */}
        <article className="border-2 border-[var(--color-ground)] p-6 sm:p-8">
          <div className="flex items-center justify-between pb-5 border-b border-[var(--color-ground)] flex-wrap gap-3">
            <StampChip tone={STATUS_CHIP[deadline.status]}>
              {STATUS_LABEL[deadline.status]}
            </StampChip>
            <span className="t-utility text-[var(--color-ground)]">
              {typeCode} · {dueShort}
            </span>
          </div>

          <div className="flex justify-center py-8">
            <PanAmTag {...panAmPropsForDeadline(deadline)} scale={1} shadow />
          </div>

          <h1
            className="text-center"
            style={{
              fontFamily: "var(--font-index)",
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.2,
              color: "var(--color-ground)",
            }}
          >
            {deadline.name}
          </h1>
          {deadline.governing_agency ? (
            <div className="t-utility text-center mt-2 text-[var(--color-ground)]">
              {deadline.governing_agency}
            </div>
          ) : null}

          <div
            className={`mt-8 mb-6 ${
              isOverdue ? "rule-stamp rule-mark" : "rule-stamp"
            }`}
            style={{
              borderTopColor: isOverdue
                ? "var(--color-mark)"
                : "var(--color-ground)",
            }}
          />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 border-2 border-[var(--color-ground)]">
            <MetaCell label="Due" value={dueLong} />
            <MetaCell label="Frequency" value={FREQ_LABELS[deadline.frequency] ?? deadline.frequency} />
            <MetaCell label="Severity" value={deadline.severity_tier.toUpperCase()} />
            <MetaCell
              label="Penalty"
              value={penalty ?? "—"}
              mark={!!penalty}
            />
            <MetaCell
              label="Statute"
              value={deadline.statute_citation ?? "—"}
            />
            <MetaCell
              label="Source"
              value={
                deadline.source_url ? (
                  <a
                    href={deadline.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-link break-all"
                  >
                    Link →
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </div>

          {deadline.description ? (
            <div className="mt-6 border-2 border-[var(--color-ground)] p-4">
              <div className="t-utility mb-2">Notes</div>
              <p
                className="text-[15px] leading-relaxed"
                style={{ fontFamily: "var(--font-index)" }}
              >
                {deadline.description}
              </p>
            </div>
          ) : null}

          {/* Documents */}
          <div className="mt-8">
            <DocumentUpload
              deadlineId={deadline.id}
              businessId={business.id}
              userId={user.id}
              existingDocuments={documents ?? []}
            />
          </div>
        </article>

        {/* Right: actions + activity */}
        <aside className="flex flex-col gap-4">
          <div className="panel-ink p-5">
            <div
              className="t-utility mb-4"
              style={{ color: "var(--color-field)" }}
            >
              Route summary
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <DTerm inverse>Status</DTerm>
              <DDef inverse>{STATUS_LABEL[deadline.status]}</DDef>
              <DTerm inverse>Due in</DTerm>
              <DDef inverse>
                {dueShort}
              </DDef>
              {penalty ? (
                <>
                  <DTerm inverse>Exposure</DTerm>
                  <DDef inverse className="text-[var(--color-mark)]">
                    {penalty}
                  </DDef>
                </>
              ) : null}
              {deadline.governing_agency ? (
                <>
                  <DTerm inverse>Agency</DTerm>
                  <DDef inverse>{deadline.governing_agency}</DDef>
                </>
              ) : null}
            </dl>
          </div>

          <div className="flex flex-col gap-3">
            {deadline.status !== "compliant" ? (
              <MarkCompliantButton deadlineId={deadline.id} />
            ) : (
              <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-4 py-3 flex flex-col gap-1">
                <span className="t-utility">Marked compliant</span>
                <span
                  className="text-[15px] font-bold"
                  style={{ fontFamily: "var(--font-index)" }}
                >
                  {new Date(deadline.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <LinkButton href={`/deadlines/${id}/edit`} variant="ghost">
              ✎ Edit deadline
            </LinkButton>
            {(() => {
              // WS-4.1 — if the deadline matches a known filing kind,
              // offer the partner-routed "File this for me" CTA.
              const kind = matchFilingKind({
                deadlineName: deadline.name,
                agency: deadline.governing_agency,
              });
              if (!kind) return null;
              const f = FILING_CATALOG[kind];
              return (
                <FileItForMeCta
                  deadlineId={deadline.id}
                  filingKind={kind}
                  label={f.label}
                  priceCents={f.priceCents}
                  description={f.description}
                  available={isFilingsConfigured()}
                />
              );
            })()}
            {isUrgent ? (
              <div className="border-2 border-[var(--color-mark)] p-4">
                <div className="t-utility text-[var(--color-mark)] mb-2">
                  Alarm bar
                </div>
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ fontFamily: "var(--font-index)" }}
                >
                  This deadline is{" "}
                  {isOverdue ? "overdue" : "due within 30 days"}. File it now
                  or document an extension to recover your score.
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetaCell({
  label,
  value,
  mark,
}: {
  label: string;
  value: React.ReactNode;
  mark?: boolean;
}) {
  return (
    <div className="px-4 py-3 border-r border-b border-[var(--color-ground)] last:border-r-0">
      <div className="t-utility mb-1">{label}</div>
      <div
        className={`text-[15px] font-bold ${
          mark ? "text-[var(--color-mark)]" : "text-[var(--color-ground)]"
        }`}
        style={{ fontFamily: "var(--font-index)" }}
      >
        {value}
      </div>
    </div>
  );
}

function DTerm({
  children,
  inverse,
}: {
  children: React.ReactNode;
  inverse?: boolean;
}) {
  return (
    <dt
      className="t-utility py-1"
      style={{ color: inverse ? "var(--color-field)" : "var(--color-ground)" }}
    >
      {children}
    </dt>
  );
}

function DDef({
  children,
  inverse,
  className,
}: {
  children: React.ReactNode;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <dd
      className={`text-[14px] font-bold py-1 ${className ?? ""}`}
      style={{
        fontFamily: "var(--font-index)",
        color: inverse ? "var(--color-field)" : "var(--color-ground)",
      }}
    >
      {children}
    </dd>
  );
}
