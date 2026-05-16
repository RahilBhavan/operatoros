export type DeadlineStatus = "overdue" | "in_progress" | "upcoming" | "compliant";
export type SeverityTier = "critical" | "high" | "medium" | "low" | "info";

// DB columns for status + severity_tier are TEXT with CHECK constraints that
// match the union types above exactly, but the generated Database type erases
// the constraint to `string`. The helper interfaces accept the bare DB shape
// and narrow at runtime — STATUS_WEIGHTS / SEVERITY_WEIGHT lookups fall back
// safely on unknown values.
export interface DeadlineLike {
  due_date: string;
  status: DeadlineStatus | string;
}

export interface DeadlineWithSeverity extends DeadlineLike {
  severity_tier?: SeverityTier | string | null;
  penalty_estimate_cents?: number | null;
  name?: string;
  id?: string;
}

export function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(y, m - 1, d);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDueDate(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days <= 30) return `Due in ${days} days`;
  const [fy, fm, fd] = dateStr.split("-").map(Number);
  return new Date(fy, fm - 1, fd).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function computeAutoStatus(deadline: DeadlineLike): DeadlineStatus {
  const days = daysUntil(deadline.due_date);
  if (deadline.status === "compliant") return "compliant";
  if (days < 0) return "overdue";
  if (days <= 30) return "in_progress";
  return "upcoming";
}

function severityWeight(s: SeverityTier | string | null | undefined): number {
  if (!s) return SEVERITY_WEIGHT.medium;
  return s in SEVERITY_WEIGHT ? SEVERITY_WEIGHT[s as SeverityTier] : SEVERITY_WEIGHT.medium;
}

// Status weights (unweighted, retained for backward compat with un-tagged data).
const STATUS_WEIGHTS: Record<DeadlineStatus, number> = {
  compliant: 10,
  upcoming: 5,
  in_progress: 0,
  overdue: -20,
};

export function computeComplianceScore(
  deadlines: DeadlineLike[],
  getStatus: (d: DeadlineLike) => DeadlineStatus = computeAutoStatus
): number {
  if (deadlines.length === 0) return 100;
  const maxScore = deadlines.length * 10;
  const actualScore = deadlines.reduce(
    (sum, d) => sum + STATUS_WEIGHTS[getStatus(d)],
    0
  );
  return Math.max(0, Math.min(100, Math.round((actualScore / maxScore) * 100)));
}

// Severity multipliers — risk-weighted scoring. A missed critical-severity
// deadline (a tax filing with five-figure penalty exposure) should drop the
// score far more than a missed low-severity admin item. Unspecified severity
// falls back to "medium" so legacy rows score the same as before.
const SEVERITY_WEIGHT: Record<SeverityTier, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0.5,
  info: 0.25,
};

export function computeRiskWeightedScore(
  deadlines: DeadlineWithSeverity[],
  getStatus: (d: DeadlineLike) => DeadlineStatus = computeAutoStatus
): number {
  if (deadlines.length === 0) return 100;
  let max = 0;
  let actual = 0;
  for (const d of deadlines) {
    const w = severityWeight(d.severity_tier);
    max += 10 * w;
    actual += STATUS_WEIGHTS[getStatus(d)] * w;
  }
  if (max === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((actual / max) * 100)));
}

// Risk dollars: sum of penalty estimates for items currently overdue or
// due within 30 days. This is the number that makes "compliance" tangible:
// a 67% score means little; "$12,400 of penalty exposure on the table" lands.
export function computeExposureCents(
  deadlines: DeadlineWithSeverity[],
  getStatus: (d: DeadlineLike) => DeadlineStatus = computeAutoStatus
): number {
  let total = 0;
  for (const d of deadlines) {
    const status = getStatus(d);
    if (status !== "overdue" && status !== "in_progress") continue;
    if (typeof d.penalty_estimate_cents === "number") total += d.penalty_estimate_cents;
  }
  return total;
}

export type ActionPriority = {
  id?: string;
  name: string;
  due_date: string;
  status: DeadlineStatus;
  severity_tier: SeverityTier;
  penalty_estimate_cents: number;
  // Higher = more urgent. Used only for ordering; not surfaced as a literal.
  score: number;
};

// Top N highest-leverage actions: overdue + high-severity items first, then
// in_progress items by penalty exposure. The output drives a "what should I
// do next" panel — a dashboard surface that converts the score into action.
export function topActions(
  deadlines: DeadlineWithSeverity[],
  limit = 3,
  getStatus: (d: DeadlineLike) => DeadlineStatus = computeAutoStatus
): ActionPriority[] {
  const STATUS_URGENCY: Record<DeadlineStatus, number> = {
    overdue: 100,
    in_progress: 50,
    upcoming: 10,
    compliant: 0,
  };
  const ranked: ActionPriority[] = deadlines
    .filter((d) => d.name)
    .map((d) => {
      const status = getStatus(d);
      const rawSeverity = d.severity_tier ?? "medium";
      const severity: SeverityTier =
        rawSeverity in SEVERITY_WEIGHT ? (rawSeverity as SeverityTier) : "medium";
      const penalty = d.penalty_estimate_cents ?? 0;
      const score =
        STATUS_URGENCY[status] * severityWeight(severity) +
        Math.min(penalty / 10000, 50);
      return {
        id: d.id,
        name: d.name as string,
        due_date: d.due_date,
        status,
        severity_tier: severity,
        penalty_estimate_cents: penalty,
        score,
      };
    })
    .filter((a) => a.status === "overdue" || a.status === "in_progress")
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit);
}

export function formatCents(cents: number): string {
  if (cents <= 0) return "$0";
  if (cents < 100000) return `$${(cents / 100).toFixed(0)}`;
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}
