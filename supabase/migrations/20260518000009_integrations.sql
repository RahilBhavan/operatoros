-- WS-2.4 + WS-3.3 — Practice-management + accountant integration scaffolds.
-- One generic table holds OAuth-style connection records for every external
-- system we integrate. Provider-specific behavior lives in app code
-- (gated on each provider's env vars).
--
-- Initial provider list:
--   • simplepractice  (WS-2.4, healthcare staff/license sync)
--   • karbon          (WS-3.3, accountant practice management)
--   • qbo             (WS-3.3, QuickBooks Online — entity metadata)
--   • intuit-tax      (WS-3.3, TaxDome alternative — future)
--
-- Schema notes:
--   • access_token + refresh_token are stored encrypted at rest by
--     Supabase Storage's pgcrypto when configured. For now we store
--     ciphertext-as-text and document the requirement.
--   • last_synced_at + last_sync_error_at give the integrations page a
--     human-readable status without parsing logs.

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null check (
    provider in ('simplepractice', 'karbon', 'qbo', 'taxdome')
  ),
  external_account_id text check (
    external_account_id is null or char_length(external_account_id) <= 200
  ),
  access_token_cipher text,
  refresh_token_cipher text,
  token_expires_at timestamptz,
  scopes text[] not null default array[]::text[],
  status text not null default 'active' check (
    status in ('active', 'paused', 'revoked', 'errored')
  ),
  last_synced_at timestamptz,
  last_sync_error_at timestamptz,
  last_sync_error text check (last_sync_error is null or char_length(last_sync_error) <= 2000),
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, provider)
);

create index if not exists integration_connections_provider_idx
  on public.integration_connections (provider, status);

create index if not exists integration_connections_business_idx
  on public.integration_connections (business_id);

alter table public.integration_connections enable row level security;

drop policy if exists integration_connections_select on public.integration_connections;
create policy integration_connections_select
  on public.integration_connections for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = integration_connections.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

-- App writes via service-role (OAuth callback path). Owner can revoke
-- (UPDATE status='revoked') but cannot read tokens directly — the SELECT
-- policy above does not project tokens; columns are filtered at query
-- time by the app.
drop policy if exists integration_connections_owner_revoke on public.integration_connections;
create policy integration_connections_owner_revoke
  on public.integration_connections for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = integration_connections.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = integration_connections.business_id
        and b.owner_id = auth.uid()
    )
  );

create or replace function public.touch_integration_connections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists integration_connections_updated_at
  on public.integration_connections;
create trigger integration_connections_updated_at
  before update on public.integration_connections
  for each row execute function public.touch_integration_connections_updated_at();
