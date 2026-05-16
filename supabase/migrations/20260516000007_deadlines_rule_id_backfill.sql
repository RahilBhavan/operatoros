-- Workstream A: backfill rule_id/rule_version/occurrence_key on pre-existing
-- deadline rows that were seeded before the rule graph existed.
--
-- Acceptance criterion from the roadmap: "Existing deadlines rows backfilled
-- with rule_id where match is unambiguous." This migration is intentionally
-- conservative: a deadline gets a rule_id only if exactly one current
-- (non-superseded) regulatory_rules row matches on the (name,
-- governing_agency, frequency, severity_tier) tuple. State-templated
-- rules whose canonical name contains `${state}` will not match — those
-- stay rule_id NULL and remain ad-hoc until a future pass with state
-- context joins through `locations`. The unique index on
-- (business_id, rule_id, occurrence_key) is partial on rule_id IS NOT NULL,
-- so unbackfilled rows are safe to coexist.
--
-- Idempotent: re-running only touches rows where rule_id is still NULL.

with candidates as (
  select
    d.id as deadline_id,
    r.rule_key,
    r.version
  from public.deadlines d
  join public.regulatory_rules r
    on r.name = d.name
   and r.governing_agency = d.governing_agency
   and r.frequency = d.frequency
   and r.severity_tier = d.severity_tier
   and r.superseded_by is null
   and r.sunset_date is null
  where d.rule_id is null
),
unique_matches as (
  select deadline_id, min(rule_key) as rule_key, min(version) as version, count(*) as match_count
  from candidates
  group by deadline_id
  having count(*) = 1
)
update public.deadlines d
   set rule_id = u.rule_key,
       rule_version = u.version,
       occurrence_key = case d.frequency
         when 'quarterly' then to_char(d.due_date, 'YYYY')
                             || '-Q'
                             || ((extract(month from d.due_date)::int - 1) / 3 + 1)::text
         when 'monthly'   then to_char(d.due_date, 'YYYY-MM')
         when 'one_time'  then 'once'
         when 'one-time'  then 'once'
         else to_char(d.due_date, 'YYYY')
       end
  from unique_matches u
 where d.id = u.deadline_id
   and d.rule_id is null;

-- Observability: surface a one-shot NOTICE with how many rows were touched
-- so the migration log shows the impact even on environments where the
-- result count isn't echoed.
do $$
declare
  v_total int;
  v_filled int;
begin
  select count(*) into v_total from public.deadlines;
  select count(*) into v_filled from public.deadlines where rule_id is not null;
  raise notice 'deadlines backfill: % of % rows now carry rule_id', v_filled, v_total;
end;
$$;
