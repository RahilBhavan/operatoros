import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MarkCompliantButton from "@/components/dashboard/MarkCompliantButton";
import DocumentUpload from "@/components/dashboard/DocumentUpload";
import type { Database } from "@/types/supabase";
import {
  Destination,
  Body,
  Caption,
  Utility,
  Index,
  LinkButton,
  SortingArrow,
} from "@/components/doctrine";

type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];

const STATUS_CONFIG: Record<
  Deadline["status"],
  { label: string; classes: string }
> = {
  overdue: {
    label: "OVERDUE",
    classes:
      "bg-[var(--color-mark)] text-[var(--color-field)] border-[var(--color-mark)]",
  },
  in_progress: {
    label: "DUE SOON",
    classes:
      "bg-[var(--color-ground)] text-[var(--color-field)] border-[var(--color-ground)]",
  },
  upcoming: {
    label: "UPCOMING",
    classes:
      "bg-transparent text-[var(--color-ground)] border-[var(--color-ground)]",
  },
  compliant: {
    label: "COMPLIANT",
    classes:
      "bg-[var(--color-field-soft)] text-[var(--color-ground)] border-[var(--color-ground)]",
  },
};

const FREQ_LABELS: Record<string, string> = {
  annual: "Annual",
  biennial: "Every 2 years",
  quarterly: "Quarterly",
  one_time: "One-time",
};

// 3-letter top-block category code from deadline_type.
const TYPE_CODE: Record<string, string> = {
  tax: "TAX",
  business_license: "LIC",
  employee_cert: "CRT",
  coi: "COI",
  entity_filing: "ENT",
  equipment_inspection: "INS",
  other: "OPS",
};

const SEVERITY_LETTER: Record<
  Deadline["severity_tier"],
  { letter: string; tone: "mark" | "ground" }
> = {
  critical: { letter: "X", tone: "mark" },
  high: { letter: "A", tone: "ground" },
  medium: { letter: "B", tone: "ground" },
  low: { letter: "C", tone: "ground" },
  info: { letter: "—", tone: "ground" },
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

  const statusConfig = STATUS_CONFIG[deadline.status];
  const dueDate = new Date(deadline.due_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const dueRef = new Date(deadline.due_date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const dueShort = new Date(deadline.due_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Top color block: red for overdue or due-soon, navy otherwise.
  const urgent =
    deadline.status === "overdue" || deadline.status === "in_progress";
  const topBlockClasses = urgent
    ? "bg-[var(--color-mark)] text-[var(--color-field)]"
    : "bg-[var(--color-ground)] text-[var(--color-field)]";

  const typeCode = TYPE_CODE[deadline.deadline_type] ?? "DOC";
  const sev = SEVERITY_LETTER[deadline.severity_tier];
  const penalty = formatPenalty(deadline.penalty_estimate_cents);
  // Short numeric reference for the top-left code: yymmdd from due_date plus id slice.
  const idCode = deadline.id.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <header className="flex items-end justify-between border-b-2 border-[var(--color-ground)] pb-6 mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Index className="!text-[15px]">PA-DL-{idCode}</Index>
            <Utility className="opacity-60">REGISTRY · ENTRY</Utility>
          </div>
          <Caption className="!mt-2">Deadline manifest</Caption>
        </div>
        <LinkButton href="/deadlines" variant="ghost">
          ← All deadlines
        </LinkButton>
      </header>

      {/* THE TAG — luggage-tag visualization of the deadline */}
      <article className="relative border-2 border-[var(--color-ground)] tag-perforated mb-6">
        {/* Top saturated block */}
        <div className={`relative px-5 pt-5 pb-7 ${topBlockClasses}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <Index className="!text-[13px] opacity-90 !text-current">
                {idCode}
              </Index>
              <div className="mt-1">
                <Utility className="!text-current !opacity-90 !text-[12px]">
                  FINAL DESTINATION
                </Utility>
              </div>
            </div>

            <span className="tag-tab -mt-5">{typeCode}</span>

            <div className="flex-1 text-right">
              <Utility className="!text-current !opacity-90 !text-[12px]">
                {(deadline.governing_agency ?? "OPERATOROS").toUpperCase()}
              </Utility>
            </div>
          </div>

          <Destination className="!text-current leading-none mb-2">
            {deadline.name}
          </Destination>

          <Utility className="!text-current !opacity-80">
            {(FREQ_LABELS[deadline.frequency] ?? deadline.frequency).toUpperCase()}
            {" · "}
            {deadline.deadline_type.replace(/_/g, " ").toUpperCase()}
          </Utility>

          {/* Reference number — red slab serif date */}
          <div className="mt-6">
            <Index
              className={
                urgent
                  ? "!text-current !text-[30px] leading-none"
                  : "!text-[var(--color-mark)] !text-[30px] leading-none"
              }
            >
              {dueRef}
            </Index>
          </div>
        </div>

        {/* Bottom cream block — metadata + actions */}
        <div className="bg-[var(--color-field)] text-[var(--color-ground)] px-5 pt-6 pb-8">
          {/* Status row */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`border-2 px-2.5 py-1 t-utility !text-[12px] !tracking-[0.1em] ${statusConfig.classes}`}
              >
                {statusConfig.label}
              </span>
              <SortingArrow
                letter={sev.letter}
                label={`Severity ${deadline.severity_tier.toUpperCase()}`}
                className={
                  sev.tone === "mark"
                    ? "!border-[var(--color-mark)] [&_*]:!text-[var(--color-mark)]"
                    : ""
                }
              />
            </div>
            {penalty && (
              <div className="text-right">
                <Utility className="block !text-[12px] opacity-70">
                  PENALTY EXPOSURE
                </Utility>
                <Index className="!text-[var(--color-mark)] !text-[24px] leading-none">
                  {penalty}
                </Index>
              </div>
            )}
          </div>

          {/* Detail grid */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 mb-6">
            <DTerm>DUE</DTerm>
            <DDef>
              <Body className="!font-bold">{dueDate}</Body>
              <Caption className="!mt-0.5">{dueShort}</Caption>
            </DDef>

            {deadline.governing_agency && (
              <>
                <DTerm>AGENCY</DTerm>
                <DDef>
                  <Body>{deadline.governing_agency}</Body>
                </DDef>
              </>
            )}

            {deadline.statute_citation && (
              <>
                <DTerm>STATUTE</DTerm>
                <DDef>
                  <Index className="!text-[15px]">
                    {deadline.statute_citation}
                  </Index>
                </DDef>
              </>
            )}

            {deadline.source_url && (
              <>
                <DTerm>SOURCE</DTerm>
                <DDef>
                  <a
                    href={deadline.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-link break-all"
                  >
                    {deadline.source_url}
                  </a>
                </DDef>
              </>
            )}

            {deadline.description && (
              <>
                <DTerm>NOTES</DTerm>
                <DDef>
                  <Body className="leading-relaxed">
                    {deadline.description}
                  </Body>
                </DDef>
              </>
            )}
          </dl>

          {/* Action row */}
          <div className="border-t-2 border-[var(--color-ground)] pt-5 flex items-center gap-3 flex-wrap">
            {deadline.status !== "compliant" && (
              <MarkCompliantButton deadlineId={deadline.id} />
            )}
            {deadline.status === "compliant" && (
              <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field-soft)] px-4 py-3 inline-flex flex-col items-start gap-1">
                <Utility>MARKED COMPLIANT</Utility>
                <Index className="!text-[15px]">
                  {new Date(deadline.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Index>
              </div>
            )}
            <LinkButton href={`/deadlines/${id}/edit`} variant="ghost">
              ✎ Edit
            </LinkButton>
          </div>
        </div>
      </article>

      {/* Documents dossier */}
      <DocumentUpload
        deadlineId={deadline.id}
        businessId={business.id}
        userId={user.id}
        existingDocuments={documents ?? []}
      />
    </div>
  );
}

function DTerm({ children }: { children: React.ReactNode }) {
  return (
    <dt className="pt-0.5">
      <Utility className="opacity-70 !text-[12px]">{children}</Utility>
    </dt>
  );
}

function DDef({ children }: { children: React.ReactNode }) {
  return <dd className="min-w-0">{children}</dd>;
}
