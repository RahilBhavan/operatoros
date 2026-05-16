-- PR1 foundation: rule metadata + idempotency for the deadline seed engine.
--
-- `rule_id`        — stable identifier for the seed rule that produced this row
--                    (e.g. "legacy.california-minimum-franchise-tax-800").
-- `rule_version`   — bumped when the rule's generator or metadata changes
--                    meaningfully; lets a future backfill query target only
--                    rows produced by an older version.
-- `occurrence_key` — stable per-period key ("2026", "2026-Q3", "2026-06",
--                    "once"); combined with rule_id and business_id forms the
--                    dedup tuple so re-seeding never duplicates.
-- `superseded_at`  — set by the state-change reconciliation flow when a rule
--                    no longer applies; partial index excludes superseded rows
--                    so the same (rule_id, occurrence_key) can be re-seeded
--                    if the rule becomes applicable again later.
--
-- Manually-created deadlines (rule_id IS NULL) remain unconstrained — users
-- can still add ad-hoc reminders without conflicting with the engine's tuples.

alter table public.deadlines
  add column if not exists rule_id text,
  add column if not exists rule_version integer,
  add column if not exists occurrence_key text,
  add column if not exists superseded_at timestamptz;

create unique index if not exists deadlines_rule_occurrence_uniq
  on public.deadlines (business_id, rule_id, occurrence_key)
  where rule_id is not null and superseded_at is null;

create index if not exists deadlines_rule_id_idx
  on public.deadlines (rule_id)
  where rule_id is not null;
