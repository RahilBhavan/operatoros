-- WS-F — Stripe-truth MRR.
--
-- Mirror of every active/trialing/canceled subscription out of Stripe so the
-- admin MRR figure no longer derives from plan_tier × count. Webhook handler
-- upserts on subscription.{created,updated,deleted}; the backfill script
-- (scripts/stripe-subscription-backfill.ts) pages through Stripe.subscriptions
-- to populate historical rows.
--
-- Schema notes:
--   • Primary key is the Stripe subscription id (sub_xxx) so upserts on
--     webhook events are natural.
--   • business_id is nullable + ON DELETE SET NULL so deleting a business
--     keeps the Stripe-side audit trail intact.
--   • plan_tier is the OS-side plan derived from the price_id in webhook
--     code; allowed values are the two paid plans today (business +
--     accountant). The `lite` tier is gated on Hard Stop #1 and is not yet
--     active.
--   • RLS: platform admins only. Per-tenant exposure is not required (the
--     business's own status is on businesses.billing_status already).

create table if not exists public.stripe_subscriptions (
  id text primary key,
  business_id uuid references public.businesses(id) on delete set null,
  customer_id text not null,
  status text not null,
  price_id text not null,
  plan_tier text not null check (plan_tier in ('business', 'accountant', 'lite')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  unit_amount_cents bigint not null,
  currency text not null default 'usd',
  updated_at timestamptz not null default now()
);

create index if not exists stripe_subscriptions_business_idx
  on public.stripe_subscriptions (business_id);
create index if not exists stripe_subscriptions_status_idx
  on public.stripe_subscriptions (status);
create index if not exists stripe_subscriptions_active_mrr_idx
  on public.stripe_subscriptions (status, unit_amount_cents)
  where status in ('active', 'trialing');

alter table public.stripe_subscriptions enable row level security;

drop policy if exists stripe_subscriptions_admin_all
  on public.stripe_subscriptions;
create policy stripe_subscriptions_admin_all
  on public.stripe_subscriptions
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
