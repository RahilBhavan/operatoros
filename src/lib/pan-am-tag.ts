import type { PanAmTagProps, TagAgency } from "@/components/doctrine/PanAmTag";

// Subset of `deadlines.Row` we need. Anything else is ignored.
export type PanAmTagDeadline = {
  id: string;
  name?: string | null;
  deadline_type: string;
  frequency: string;
  due_date: string;
  status: "upcoming" | "compliant" | "overdue" | "in_progress";
  severity_tier: "critical" | "high" | "medium" | "low" | "info";
  governing_agency?: string | null;
};

const TYPE_TO_AGENCY: Record<string, TagAgency> = {
  tax: "irs",
  business_license: "license",
  employee_cert: "osha",
  coi: "insurance",
  entity_filing: "state",
  equipment_inspection: "osha",
  other: "state",
};

const TYPE_CODE: Record<string, string> = {
  tax: "IRS",
  business_license: "LIC",
  employee_cert: "CRT",
  coi: "COI",
  entity_filing: "SOS",
  equipment_inspection: "INS",
  other: "BIZ",
};

// Form-stem per (type, frequency) — the heavy black numeric in the sort run.
// Reads like a real federal/state form code without claiming to be one.
const FORM_STEM: Record<string, Record<string, string>> = {
  tax: { quarterly: "941", annual: "1120", one_time: "SS-4", biennial: "1120" },
  business_license: { annual: "BL-1", biennial: "BL-2", quarterly: "BL-Q", one_time: "BL-0" },
  employee_cert: { annual: "300A", biennial: "301", quarterly: "300Q", one_time: "301-T" },
  coi: { annual: "ACORD25", biennial: "ACORD27", quarterly: "ACORD-Q", one_time: "ACORD-0" },
  entity_filing: { annual: "ST-30", biennial: "ST-60", quarterly: "ST-Q", one_time: "ST-1" },
  equipment_inspection: { annual: "EQ-A", biennial: "EQ-B", quarterly: "EQ-Q", one_time: "EQ-1" },
  other: { annual: "OPS-A", biennial: "OPS-B", quarterly: "OPS-Q", one_time: "OPS-1" },
};

// FNV-1a 32-bit. Deterministic, no crypto needed — these values seed visuals.
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function letter(n: number): string {
  return String.fromCharCode(65 + (n % 26));
}

function pad(n: number, width: number): string {
  return n.toString().padStart(width, "0");
}

function dueParts(iso: string): { y: number; m: number; d: number; q: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d, q: Math.ceil(m / 3) };
}

function stemSuffix(frequency: string, iso: string): string {
  const { y, m, q } = dueParts(iso);
  if (frequency === "quarterly") return `—Q${q}`;
  if (frequency === "annual" || frequency === "biennial") return `—FY${pad(y % 100, 2)}`;
  return `—M${pad(m, 2)}`;
}

const STRIP_STATE: Record<PanAmTagDeadline["status"], string> = {
  overdue: "ROUTE BLOCKED",
  in_progress: "FINAL DEADLINE",
  upcoming: "BOOKED IN",
  compliant: "COMPLETED",
};

/**
 * Derive a complete, deterministic PanAmTag prop set from a deadline row.
 * Same deadline always produces the same artifact — the tag *is* the deadline's
 * physical identity. Different deadlines vary by serial, routing letter,
 * pressing code, and sort run; type drives palette + destination code.
 */
export function panAmPropsForDeadline(
  deadline: PanAmTagDeadline
): Omit<PanAmTagProps, "scale" | "shadow"> {
  const h = hash32(deadline.id);

  const agency = TYPE_TO_AGENCY[deadline.deadline_type] ?? "state";
  const destination = TYPE_CODE[deadline.deadline_type] ?? "BIZ";

  const { y, m, d } = dueParts(deadline.due_date);
  const city = `${[
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ][m - 1]} · ${pad(d, 2)} · ${y}`;

  const serial = pad(h % 1_000_000, 6);

  const isOverdue = deadline.status === "overdue";
  const isCompliant = deadline.status === "compliant";
  const routing = isOverdue ? "X" : isCompliant ? "Z" : letter(h >>> 8);
  const routingMark =
    deadline.severity_tier === "critical" ||
    deadline.severity_tier === "high" ||
    isOverdue ||
    deadline.status === "in_progress";

  const stemMap = FORM_STEM[deadline.deadline_type] ?? FORM_STEM.other;
  const stem = stemMap[deadline.frequency] ?? stemMap.annual ?? "OPS-A";
  const formRun = {
    a: `B-${((h >>> 16) % 9) + 1},`,
    b: stem,
    c: stemSuffix(deadline.frequency, deadline.due_date),
  };

  const idCode = deadline.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const ruleShort = pad((h >>> 4) % 10000, 4);
  const stripLeft = `${idCode}-${ruleShort} / ${STRIP_STATE[deadline.status]}`;

  const pressMonth = ((h >>> 12) % 12) + 1;
  const pressDay = ((h >>> 20) % 28) + 1;
  const stripRight = `PTD. BY OPS / ${pad(pressMonth, 2)}-${pad(pressDay, 2)}/${routing}`;

  return {
    serial,
    destination,
    city,
    agency,
    topColor: isOverdue ? "#C8102E" : undefined,
    routing,
    routingMark,
    formRun,
    stripLeft,
    stripRight,
    brand: "OPERATOR · OS",
  };
}
