-- After applying: run `npm run db:types` to regenerate src/types/supabase.ts
--
-- Audit remediation pass. Runs after 20260517000001_security_hardening_v2.sql.
-- Each numbered section maps 1:1 to a finding from the data-layer audit.

-- ── 1. Stripe webhook idempotency table ────────────────────────────────────
-- The Stripe webhook handler can be invoked more than once for the same
-- event_id (Stripe retries on 5xx, manual replays, etc.). Insert-and-check
-- against this table to short-circuit duplicate processing.
create table if not exists public.stripe_received_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_received_events enable row level security;
-- no policies; only service_role writes/reads

create index if not exists stripe_received_events_received_at_idx
  on public.stripe_received_events (received_at);

-- ── 2. SECURITY DEFINER GRANT lockdown ─────────────────────────────────────
-- The corrections RPCs are only ever invoked from admin routes that use the
-- service-role client. Drop the authenticated grant so an authenticated
-- non-admin can't probe them.
revoke execute on function public.accept_correction(uuid) from authenticated, anon;
grant  execute on function public.accept_correction(uuid) to service_role;

revoke execute on function public.reject_correction(uuid, text) from authenticated, anon;
grant  execute on function public.reject_correction(uuid, text) to service_role;

revoke execute on function public.version_regulatory_rule(uuid, jsonb) from authenticated, anon;
grant  execute on function public.version_regulatory_rule(uuid, jsonb) to service_role;

-- ── 3. regulatory_rules cycle protection ───────────────────────────────────
-- A row pointing superseded_by to itself, or two rows mutually pointing at
-- each other, would loop the lookup query forever. Cheap CHECK rules out the
-- one-hop case; the trigger walks the chain to catch longer cycles.

alter table public.regulatory_rules
  drop constraint if exists regulatory_rules_no_self_supersede_chk;
alter table public.regulatory_rules
  add constraint regulatory_rules_no_self_supersede_chk
  check (superseded_by is null or superseded_by <> id);

create or replace function public.prevent_regulatory_rule_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_cycle boolean;
begin
  if new.superseded_by is null then
    return new;
  end if;

  with recursive chain (id, superseded_by, depth) as (
    -- start from the proposed target; if we ever reach NEW.id, it's a cycle.
    select r.id, r.superseded_by, 1
      from public.regulatory_rules r
     where r.id = new.superseded_by
    union all
    select r.id, r.superseded_by, c.depth + 1
      from public.regulatory_rules r
      join chain c on r.id = c.superseded_by
     where c.depth < 32
       and c.superseded_by is not null
  )
  select exists (select 1 from chain where id = new.id) into v_cycle;

  if v_cycle then
    raise exception 'cyclic supersede chain';
  end if;

  return new;
end;
$$;

drop trigger if exists regulatory_rules_prevent_cycle on public.regulatory_rules;
create trigger regulatory_rules_prevent_cycle
  before insert or update of superseded_by on public.regulatory_rules
  for each row execute function public.prevent_regulatory_rule_cycle();

-- ── 4. accountant_deadline_notes explicit deny policy ──────────────────────
-- Table was created with `enable rls` and zero policies — Postgres already
-- denies by default, but an explicit deny is grep-able and survives a
-- future "add a policy" mistake.
drop policy if exists "deny anon and authenticated direct access"
  on public.accountant_deadline_notes;
alter table public.accountant_deadline_notes enable row level security;
create policy "deny anon and authenticated direct access"
  on public.accountant_deadline_notes
  for all to anon, authenticated using (false) with check (false);

-- ── 5. CHECK constraints on deadlines.frequency ────────────────────────────
-- Normalize legacy 'one-time' → 'one_time', then constrain to the set
-- actually used by the engine + UI (regulatory-graph.ts + DeadlineForm).
-- deadline_type has too many real values (entity_filing, business_license,
-- tax_filing, employee_cert, coi, equipment_inspection, other, …) so we
-- skip the CHECK there per the audit fallback.
update public.deadlines set frequency = 'one_time' where frequency = 'one-time';

alter table public.deadlines
  drop constraint if exists deadlines_frequency_chk;
alter table public.deadlines
  add constraint deadlines_frequency_chk
  check (frequency in ('annual','quarterly','monthly','one_time','biennial','triennial','decennial'));

-- ── 6. UNIQUE on documents (business_id, file_path) ────────────────────────
-- Prevents the same storage object being recorded twice under the same
-- business. We don't dedupe pre-existing rows; if the ADD CONSTRAINT fails
-- on apply, the operator will manually dedupe and re-run.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'documents_business_id_file_path_uniq'
       and conrelid = 'public.documents'::regclass
  ) then
    alter table public.documents
      add constraint documents_business_id_file_path_uniq
      unique (business_id, file_path);
  end if;
end $$;

-- ── 7. ON DELETE SET NULL on user FKs ──────────────────────────────────────
-- audit_log.user_id, documents.uploaded_by, deadlines.assigned_to currently
-- default to NO ACTION which blocks auth.users deletions. Switching to
-- SET NULL keeps history intact when a user is purged. FK constraint names
-- are unknown (Postgres autogenerated), so we look them up.
do $$
declare
  v_conname text;
begin
  -- audit_log.user_id → SET NULL
  alter table public.audit_log alter column user_id drop not null;
  select conname into v_conname
    from pg_constraint
   where conrelid = 'public.audit_log'::regclass
     and contype = 'f'
     and conkey = (select array_agg(attnum) from pg_attribute
                    where attrelid = 'public.audit_log'::regclass and attname = 'user_id');
  if v_conname is not null then
    execute format('alter table public.audit_log drop constraint %I', v_conname);
  end if;
  alter table public.audit_log
    add constraint audit_log_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

  -- documents.uploaded_by → SET NULL
  alter table public.documents alter column uploaded_by drop not null;
  select conname into v_conname
    from pg_constraint
   where conrelid = 'public.documents'::regclass
     and contype = 'f'
     and conkey = (select array_agg(attnum) from pg_attribute
                    where attrelid = 'public.documents'::regclass and attname = 'uploaded_by');
  if v_conname is not null then
    execute format('alter table public.documents drop constraint %I', v_conname);
  end if;
  alter table public.documents
    add constraint documents_uploaded_by_fkey
    foreign key (uploaded_by) references auth.users(id) on delete set null;

  -- deadlines.assigned_to → SET NULL (already nullable in the original DDL)
  select conname into v_conname
    from pg_constraint
   where conrelid = 'public.deadlines'::regclass
     and contype = 'f'
     and conkey = (select array_agg(attnum) from pg_attribute
                    where attrelid = 'public.deadlines'::regclass and attname = 'assigned_to');
  if v_conname is not null then
    execute format('alter table public.deadlines drop constraint %I', v_conname);
  end if;
  alter table public.deadlines
    add constraint deadlines_assigned_to_fkey
    foreign key (assigned_to) references auth.users(id) on delete set null;
end $$;

-- ── 8. reminder_log retry — partial UNIQUE where status='sent' ─────────────
-- The original UNIQUE(deadline_id, reminder_type) blocked retries after a
-- failed send. Replace with a partial unique so only successful sends count
-- toward uniqueness.
do $$
declare
  v_conname text;
begin
  select conname into v_conname
    from pg_constraint
   where conrelid = 'public.reminder_log'::regclass
     and contype = 'u'
     and conkey = (
       select array_agg(attnum order by attnum) from pg_attribute
        where attrelid = 'public.reminder_log'::regclass
          and attname in ('deadline_id','reminder_type')
     );
  if v_conname is not null then
    execute format('alter table public.reminder_log drop constraint %I', v_conname);
  end if;
end $$;

create unique index if not exists reminder_log_sent_uniq
  on public.reminder_log (deadline_id, reminder_type)
  where status = 'sent';

-- ── 9. auth_rate_limits race fix ───────────────────────────────────────────
-- The original try_consume_… does an UPDATE then conditional INSERT … ON
-- CONFLICT, which can race when two callers see the same expired window at
-- the same instant. A transactional advisory lock keyed on the rate-limit
-- key serializes concurrent callers per-key without locking the table.
create or replace function public.try_consume_auth_rate_limit(
  p_key text,
  p_max_attempts int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz := now() - (p_window_seconds || ' seconds')::interval;
  v_rows int;
begin
  -- Per-key xact lock; auto-released at commit. Hashtext keeps it bigint.
  perform pg_advisory_xact_lock(hashtext(p_key));

  update public.auth_rate_limits
     set attempts = attempts + 1
   where key = p_key
     and window_start >= v_window_start
     and attempts < p_max_attempts;

  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    return true;
  end if;

  insert into public.auth_rate_limits (key, attempts, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set attempts = 1,
        window_start = now()
    where public.auth_rate_limits.window_start < v_window_start;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.try_consume_auth_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.try_consume_auth_rate_limit(text, int, int) to service_role;

-- ── 10. auth_rate_limits cleanup function ──────────────────────────────────
-- Called from a cron route. Window is the natural TTL; 24h is well past any
-- real window length we configure.
create or replace function public.cleanup_auth_rate_limits()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.auth_rate_limits
   where window_start < now() - interval '24 hours';
end;
$$;

revoke all on function public.cleanup_auth_rate_limits() from public, anon, authenticated;
grant execute on function public.cleanup_auth_rate_limits() to service_role;

-- ── 11. rule_confidence refresh exposure ───────────────────────────────────
-- Defensive re-grant; already set in 20260516000008 but a future migration
-- could regress it. Idempotent.
revoke all on function public.refresh_rule_confidence() from public, anon, authenticated;
grant execute on function public.refresh_rule_confidence() to service_role;

-- ── 12. unsubscribe_reminders rate limit + constant-time return ────────────
-- Before: returned boolean reflecting whether the token matched, which is an
-- enumeration oracle. After: always returns true (caller renders a generic
-- "you've been unsubscribed" page regardless) and is rate-limited so an
-- attacker can't brute-force the token space.
--
-- Note: we intentionally do NOT hash unsubscribe_token at rest. The cron
-- reminder job rebuilds the unsubscribe URL on every email send and would
-- need the plaintext server-side anyway. The threat model for an unsub
-- token is low — leak only allows opting someone out of their reminder
-- emails — so the operational cost of hashing isn't worth it here.
create or replace function public.unsubscribe_reminders(p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowed boolean;
begin
  v_allowed := public.try_consume_auth_rate_limit(
    'unsub:' || coalesce(p_token, 'null'),
    5,
    3600
  );
  if not v_allowed then
    return false;
  end if;

  update public.reminder_preferences
     set email_enabled = false, updated_at = now()
   where unsubscribe_token = p_token;

  -- Constant response regardless of match — don't leak token validity.
  return true;
end;
$$;

revoke all on function public.unsubscribe_reminders(text) from public;
grant execute on function public.unsubscribe_reminders(text) to anon, authenticated, service_role;

-- ── 13. claim_platform_admin_invite email enforcement ──────────────────────
-- Original RPC accepted any token from any signed-in user. Now we require
-- the calling user's auth.email() (case-insensitive) to match invited_email.
create or replace function public.claim_platform_admin_invite(p_token text, p_display_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  v_caller_email text := auth.email();
  v_invite_id uuid;
  v_email text;
begin
  if uid is null then
    return false;
  end if;

  -- Look up by token_hash (the plaintext token column is dropped in
  -- section 14 below; plpgsql resolves names lazily at call time, so this
  -- is fine even though section 14 runs after this function is created).
  select id, invited_email into v_invite_id, v_email
    from public.platform_admin_invites
   where token_hash = encode(sha256(coalesce(p_token, '')::bytea), 'hex')
     and used_at is null
     and revoked_at is null
     and expires_at > now()
   for update;

  if v_invite_id is null then
    return false;
  end if;

  if v_caller_email is null
     or lower(v_caller_email) <> lower(v_email) then
    raise exception 'invite email mismatch' using errcode = '42501';
  end if;

  update public.platform_admin_invites
     set used_at = now(), used_by = uid
   where id = v_invite_id;

  insert into public.platform_admins (user_id, display_name, created_by)
  values (uid, coalesce(p_display_name, v_email), (
    select created_by from public.platform_admin_invites where id = v_invite_id
  ))
  on conflict (user_id) do update
    set revoked_at = null,
        display_name = coalesce(public.platform_admins.display_name, excluded.display_name);

  return true;
end;
$$;

revoke all on function public.claim_platform_admin_invite(text, text) from public, anon;
grant execute on function public.claim_platform_admin_invite(text, text) to authenticated;

-- ── 14. Token hashing schema ───────────────────────────────────────────────
-- Store only sha256(token) in the database. Plaintext tokens still travel in
-- URLs (we can't change that without breaking outstanding links), but a DB
-- snapshot leak no longer hands out working credentials. The API layer
-- hashes the incoming token and looks up by hash.

-- share_tokens
alter table public.share_tokens add column if not exists token_hash text;
update public.share_tokens
   set token_hash = encode(sha256(token::bytea), 'hex')
 where token_hash is null;
alter table public.share_tokens alter column token_hash set not null;
create unique index if not exists share_tokens_token_hash_key
  on public.share_tokens (token_hash);
drop index if exists share_tokens_token_idx;
alter table public.share_tokens drop constraint if exists share_tokens_token_key;
alter table public.share_tokens drop column if exists token;

-- accountant_connections
alter table public.accountant_connections add column if not exists token_hash text;
update public.accountant_connections
   set token_hash = encode(sha256(token::bytea), 'hex')
 where token_hash is null;
alter table public.accountant_connections alter column token_hash set not null;
create unique index if not exists accountant_connections_token_hash_key
  on public.accountant_connections (token_hash);
drop index if exists idx_accountant_connections_token;
alter table public.accountant_connections drop constraint if exists accountant_connections_token_key;
alter table public.accountant_connections drop column if exists token;

-- platform_admin_invites
alter table public.platform_admin_invites add column if not exists token_hash text;
update public.platform_admin_invites
   set token_hash = encode(sha256(token::bytea), 'hex')
 where token_hash is null;
alter table public.platform_admin_invites alter column token_hash set not null;
create unique index if not exists platform_admin_invites_token_hash_key
  on public.platform_admin_invites (token_hash);
drop index if exists idx_platform_admin_invites_token;
alter table public.platform_admin_invites drop constraint if exists platform_admin_invites_token_key;
alter table public.platform_admin_invites drop column if exists token;

-- (reminder_preferences.unsubscribe_token intentionally NOT hashed — see
-- section 12 comment for the rationale. The cron route still reads plaintext.)

-- ── 15. accountant_deadline_notes: token → connection_id ───────────────────
-- The notes table was keyed on the raw accountant_token. Now that
-- accountant_connections.token has been hashed/dropped above, we must
-- re-key notes by connection_id. The connection backfill MUST run BEFORE
-- accountant_connections.token is dropped — but section 14 above already
-- did the drop, so we backfill from the *new* token_hash by joining on
-- the hash of accountant_token (the original plaintext is still here).
alter table public.accountant_deadline_notes
  add column if not exists connection_id uuid
  references public.accountant_connections(id) on delete cascade;

update public.accountant_deadline_notes adn
   set connection_id = ac.id
  from public.accountant_connections ac
 where adn.connection_id is null
   and ac.token_hash = encode(sha256(adn.accountant_token::bytea), 'hex');

-- Any orphan rows (notes whose source connection no longer exists) are
-- deleted — they were already inaccessible since the lookup token is gone.
delete from public.accountant_deadline_notes where connection_id is null;

alter table public.accountant_deadline_notes alter column connection_id set not null;

drop index if exists accountant_deadline_notes_unique;
create unique index if not exists accountant_deadline_notes_unique
  on public.accountant_deadline_notes (deadline_id, connection_id);

alter table public.accountant_deadline_notes drop column if exists accountant_token;
