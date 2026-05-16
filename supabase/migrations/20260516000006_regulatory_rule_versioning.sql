-- Workstream A: rule editing produces a new version, never an in-place edit.
--
-- `version_regulatory_rule(p_id, p_changes)`
--   • verifies the caller is a platform admin (via is_platform_admin())
--   • acquires FOR UPDATE on the source row so concurrent edits serialise
--   • refuses to fork an already-superseded row (one head per chain)
--   • inserts a v+1 row that inherits all unchanged fields and applies the
--     fields present in p_changes
--   • points the prior row's superseded_by at the new id
--   • stamps last_verified_at / last_verified_by on the new row (editing
--     IS verification — the admin just made an authoritative claim)
--   • writes a regulatory_rule_sources row with source_kind='admin_edit'
--     and source_ref = the prior rule_id (so the chain is queryable)
--   • returns the new rule id
--
-- The lookup index `regulatory_rules_lookup_idx` is partial on
-- `superseded_by is null and sunset_date is null`, so consumers
-- automatically see only the current head per (jurisdiction, industry,
-- rule_key) chain.

create or replace function public.version_regulatory_rule(
  p_rule_id uuid,
  p_changes jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_old public.regulatory_rules%rowtype;
  v_new_id uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_old
    from public.regulatory_rules
   where id = p_rule_id
   for update;

  if not found then
    raise exception 'rule not found' using errcode = 'P0002';
  end if;

  if v_old.superseded_by is not null then
    raise exception 'rule already superseded' using errcode = '22023';
  end if;

  insert into public.regulatory_rules (
    jurisdiction_type,
    jurisdiction_code,
    industry_slug,
    rule_key,
    name,
    description,
    deadline_type,
    governing_agency,
    frequency,
    due_date_rule,
    applies_when,
    severity_tier,
    penalty_estimate_cents,
    source_url,
    statute_citation,
    effective_date,
    sunset_date,
    version,
    last_verified_at,
    last_verified_by
  )
  values (
    v_old.jurisdiction_type,
    v_old.jurisdiction_code,
    v_old.industry_slug,
    v_old.rule_key,
    coalesce(p_changes->>'name', v_old.name),
    coalesce(p_changes->>'description', v_old.description),
    coalesce(p_changes->>'deadline_type', v_old.deadline_type),
    coalesce(p_changes->>'governing_agency', v_old.governing_agency),
    coalesce(p_changes->>'frequency', v_old.frequency),
    coalesce(p_changes->'due_date_rule', v_old.due_date_rule),
    coalesce(p_changes->'applies_when', v_old.applies_when),
    coalesce(p_changes->>'severity_tier', v_old.severity_tier),
    case
      when p_changes ? 'penalty_estimate_cents'
        then nullif(p_changes->>'penalty_estimate_cents', '')::bigint
      else v_old.penalty_estimate_cents
    end,
    case
      when p_changes ? 'source_url'
        then nullif(p_changes->>'source_url', '')
      else v_old.source_url
    end,
    case
      when p_changes ? 'statute_citation'
        then nullif(p_changes->>'statute_citation', '')
      else v_old.statute_citation
    end,
    coalesce(nullif(p_changes->>'effective_date', '')::date, v_old.effective_date),
    case
      when p_changes ? 'sunset_date'
        then nullif(p_changes->>'sunset_date', '')::date
      else v_old.sunset_date
    end,
    v_old.version + 1,
    now(),
    v_user
  )
  returning id into v_new_id;

  update public.regulatory_rules
     set superseded_by = v_new_id
   where id = p_rule_id;

  insert into public.regulatory_rule_sources (rule_id, source_kind, source_ref)
  values (v_new_id, 'admin_edit', p_rule_id::text);

  return v_new_id;
end;
$$;

revoke all on function public.version_regulatory_rule(uuid, jsonb) from public, anon;
grant execute on function public.version_regulatory_rule(uuid, jsonb) to authenticated;
