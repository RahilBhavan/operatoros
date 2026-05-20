import { Check, AlertTriangle, Clock } from "lucide-react";
import type { RuleConfidenceRow } from "@/lib/admin/data";

type Tier = RuleConfidenceRow["confidence_tier"];

// Renders a small confidence indicator next to a deadline. Subtle gray for
// unverified/stale, green-checkmark for community_validated, mark-red for
// disputed (status='low' after 2+ rejected corrections). Baseline rules
// (verified ≤180d, no accepted/rejected corrections of note) render
// nothing — the absence of a badge means "looks normal."
export default function ConfidenceBadge({ confidence }: { confidence: RuleConfidenceRow | null }) {
  if (!confidence) return null;
  const tier = confidence.confidence_tier;
  if (tier === "baseline") return null;

  const variant = VARIANTS[tier];
  return (
    <span
      title={tooltipFor(tier, confidence)}
      className={`inline-flex items-center gap-1 border-2 px-1.5 py-0.5 t-caption normal-case !text-[11px] ${variant.className}`}
    >
      <variant.Icon className="w-3 h-3" />
      <span>{variant.label}</span>
    </span>
  );
}

const VARIANTS: Record<
  Exclude<Tier, "baseline">,
  { label: string; className: string; Icon: typeof Check }
> = {
  community_validated: {
    label: "Verified",
    className:
      "border-[var(--color-ground)] bg-[var(--color-field)] text-[var(--color-ground)]",
    Icon: Check,
  },
  unverified: {
    label: "Unverified",
    className: "border-[var(--color-ground)] bg-[var(--color-field)] ",
    Icon: AlertTriangle,
  },
  stale: {
    label: "Outdated",
    className: "border-[var(--color-ground)] bg-[var(--color-field)] ",
    Icon: Clock,
  },
  low: {
    label: "Disputed",
    className: "border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)]",
    Icon: AlertTriangle,
  },
};

function tooltipFor(tier: Tier, confidence: RuleConfidenceRow): string {
  switch (tier) {
    case "community_validated":
      return `Verified by ${confidence.accepted_corrections} accountant${
        confidence.accepted_corrections === 1 ? "" : "s"
      }`;
    case "unverified":
      return "This rule has not been verified against an agency source.";
    case "stale":
      return `Last verified ${formatRelative(confidence.last_verified_at)}.`;
    case "low":
      return `${confidence.rejected_corrections} corrections rejected — admin review pending.`;
    case "baseline":
      return "";
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days}d ago`;
  if (days < 180) return `${days}d ago`;
  return `${days}d ago — overdue for re-verification`;
}
