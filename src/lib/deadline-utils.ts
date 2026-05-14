export type DeadlineStatus = "overdue" | "in_progress" | "upcoming" | "compliant";

export interface DeadlineLike {
  due_date: string;
  status: DeadlineStatus;
}

export function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(y, m - 1, d); // local midnight, not UTC
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

// Weights: compliant=10 (proven), upcoming=5 (tracked, unproven), in_progress=0 (due soon),
// overdue=-20 (failed). Max = total * 10. Overdue collapses the score severely.
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
