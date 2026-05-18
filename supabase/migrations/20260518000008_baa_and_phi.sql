-- WS-2.2 — HIPAA BAA scaffolds. Required to legally store PHI-adjacent
-- documents for healthcare customers (~9 panel personas: dental, PT, chiro,
-- med spa, derm, mental health, optometry, home health, ALF).
--
-- This migration ships the storage schema only. The actual legal text of
-- the BAA must be drafted by a healthcare-data attorney ($5-15K outside
-- fee) — see docs/security/hipaa-baa-todo.md.
--
-- Schema notes:
--   • business_associate_agreements stores one row per signed BAA. The
--     `pdf_document_id` points at a stored copy of the executed agreement.
--   • phi_access_log is append-only and captures who accessed which PHI-
--     classified document for which business, when. The application code
--     must call this from every PHI-document read path — RLS does not
--     enforce log writes.

create table if not exists public.business_associate_agreements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  version text not null check (char_length(version) between 1 and 32),
  signed_at timestamptz not null,
  signed_by_user_id uuid references auth.users(id) on delete set null,
  signer_name text not null check (char_length(signer_name) between 1 and 200),
  signer_title text check (signer_title is null or char_length(signer_title) <= 200),
  signer_ip text check (signer_ip is null or char_length(signer_ip) <= 100),
  pdf_document_id uuid references public.documents(id) on delete set null,
  effective_until timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists baa_business_idx
  on public.business_associate_agreements (business_id, signed_at desc);

create index if not exists baa_active_idx
  on public.business_associate_agreements (business_id)
  where revoked_at is null;

alter table public.business_associate_agreements enable row level security;

drop policy if exists baa_select on public.business_associate_agreements;
create policy baa_select
  on public.business_associate_agreements for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_associate_agreements.business_id
        and b.owner_id = auth.uid()
    )
    or public.is_platform_admin()
  );

-- Inserts only via service-role (the BAA acceptance API route). No update
-- or delete policy → signed BAAs are immutable from app code; revocation
-- is handled by setting revoked_at via admin only.
drop policy if exists baa_admin_write on public.business_associate_agreements;
create policy baa_admin_write
  on public.business_associate_agreements for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ─── phi_access_log (append-only audit) ──────────────────────────────────

create table if not exists public.phi_access_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  accountant_connection_id uuid references public.accountant_connections(id) on delete set null,
  share_token_id uuid references public.share_tokens(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  deadline_id uuid references public.deadlines(id) on delete set null,
  staff_credential_id uuid,
  action text not null check (
    action in ('view', 'download', 'list', 'share', 'export')
  ),
  ip text check (ip is null or char_length(ip) <= 100),
  user_agent text check (user_agent is null or char_length(user_agent) <= 1000),
  accessed_at timestamptz not null default now()
);

create index if not exists phi_access_log_business_idx
  on public.phi_access_log (business_id, accessed_at desc);

create index if not exists phi_access_log_document_idx
  on public.phi_access_log (document_id, accessed_at desc)
  where document_id is not null;

alter table public.phi_access_log enable row level security;

drop policy if exists phi_access_log_admin_read on public.phi_access_log;
create policy phi_access_log_admin_read
  on public.phi_access_log for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists phi_access_log_owner_read on public.phi_access_log;
create policy phi_access_log_owner_read
  on public.phi_access_log for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = phi_access_log.business_id
        and b.owner_id = auth.uid()
    )
  );
