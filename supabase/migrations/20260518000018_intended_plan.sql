-- Onboarding plan picker: persist the plan the user chose during onboarding
-- so /billing can highlight it first when they land. This is intent, not
-- subscription state — `plan_tier` remains 'free' until a Stripe subscription
-- webhook flips it. The two columns are decoupled deliberately so users can
-- defer payment without losing their intended plan.

alter table public.businesses
  add column if not exists intended_plan text check (
    intended_plan is null
    or intended_plan in ('business', 'accountant')
  );

create index if not exists businesses_intended_plan_idx
  on public.businesses(intended_plan)
  where intended_plan is not null;
