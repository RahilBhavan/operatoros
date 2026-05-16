-- PR1 foundation: transactional onboarding completion.
--
-- Wraps the business + location + deadline writes in a single Postgres
-- transaction so partial-state-on-network-failure becomes impossible.
-- Replaces three separate client-side .insert() calls from the onboarding
-- page. The seed array is produced server-side from buildStarterDeadlines()
-- and passed in as jsonb.
--
-- SECURITY INVOKER keeps RLS enforced — the function can only touch rows
-- the calling user already owns via the existing policies.
-- Idempotency comes from the partial unique index on
-- (business_id, rule_id, occurrence_key) added in the prior migration:
-- re-running this RPC for the same user inserts zero duplicate deadline
-- rows. If the business row already exists (re-onboarding), it is reused
-- and updated rather than recreated, so the FK to deadlines remains stable.

create or replace function public.complete_onboarding(
  p_business jsonb,
  p_location jsonb,
  p_seeds jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_biz uuid;
  v_loc uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Reuse the business row if onboarding is being re-attempted after a
  -- partial failure or settings change. owner_id is unique-per-user in
  -- practice because the onboarding flow only ever creates one.
  select id into v_biz
    from public.businesses
   where owner_id = v_uid
   limit 1;

  if v_biz is null then
    insert into public.businesses (
      owner_id, name, industry_slug, entity_type,
      employee_count, hires_contractors, onboarding_complete
    )
    values (
      v_uid,
      p_business->>'name',
      nullif(p_business->>'industry_slug', ''),
      nullif(p_business->>'entity_type', ''),
      nullif(p_business->>'employee_count', '')::int,
      coalesce((p_business->>'hires_contractors')::boolean, false),
      true
    )
    returning id into v_biz;
  else
    update public.businesses
       set name = coalesce(p_business->>'name', name),
           industry_slug = coalesce(nullif(p_business->>'industry_slug', ''), industry_slug),
           entity_type = coalesce(nullif(p_business->>'entity_type', ''), entity_type),
           employee_count = coalesce(nullif(p_business->>'employee_count', '')::int, employee_count),
           hires_contractors = coalesce((p_business->>'hires_contractors')::boolean, hires_contractors),
           onboarding_complete = true
     where id = v_biz;
  end if;

  -- Always (re-)create a location row for the submitted state. We don't
  -- dedupe locations here in PR1 — the user can only submit one in the
  -- onboarding flow today, and the multi-location flow handles its own
  -- dedup. State-change reconciliation lands in PR6.
  insert into public.locations (business_id, state)
  values (v_biz, p_location->>'state')
  returning id into v_loc;

  -- Seed deadlines. Partial unique index swallows duplicates from a re-run.
  insert into public.deadlines (
    business_id, location_id, name, description, deadline_type,
    governing_agency, frequency, due_date, source, severity_tier,
    penalty_estimate_cents, source_url, statute_citation,
    rule_id, rule_version, occurrence_key
  )
  select
    v_biz,
    v_loc,
    s->>'name',
    s->>'description',
    coalesce(s->>'deadline_type', 'other'),
    s->>'governing_agency',
    coalesce(s->>'frequency', 'annual'),
    (s->>'due_date')::date,
    coalesce(s->>'source', 'discovery_agent'),
    coalesce(s->>'severity_tier', 'medium'),
    nullif(s->>'penalty_estimate_cents', '')::bigint,
    nullif(s->>'source_url', ''),
    nullif(s->>'statute_citation', ''),
    nullif(s->>'rule_id', ''),
    nullif(s->>'rule_version', '')::int,
    nullif(s->>'occurrence_key', '')
  from jsonb_array_elements(p_seeds) as s
  on conflict (business_id, rule_id, occurrence_key)
    where rule_id is not null and superseded_at is null
  do nothing;

  return v_biz;
end;
$$;

revoke all on function public.complete_onboarding(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.complete_onboarding(jsonb, jsonb, jsonb) to authenticated;
