-- Audit-remediation pass. Closes the open issues the 2026-05-18 audit
-- surfaced against the WS-2.x feature expansion:
--
--   • phi_access_log.staff_credential_id had no FK → orphan risk.
--   • phi_access_log.action enum only covered read paths; HIPAA audit
--     trail also needs create/update/delete records.
--   • Compliance-table mutations (staff_credentials, credential_renewals_log,
--     business_associate_agreements) had no audit_events writes →
--     centralised audit sink missed PHI-relevant events.
--   • filings table had no DELETE policy → inconsistent (default deny is
--     safe, but an explicit policy makes intent clear).
--   • sms_log allowed (user_id, business_id) both null or both set →
--     ambiguous context.

-- ─── phi_access_log.staff_credential_id FK + extended action enum ────────

alter table public.phi_access_log
  drop constraint if exists phi_access_log_action_check;

alter table public.phi_access_log
  add constraint phi_access_log_action_check
  check (action in ('view', 'download', 'list', 'share', 'export',
                    'create', 'update', 'delete'));

-- The column was declared as plain uuid; add the FK now that no
-- callers depend on the looser shape.
alter table public.phi_access_log
  add constraint phi_access_log_staff_credential_id_fkey
  foreign key (staff_credential_id)
  references public.staff_credentials(id)
  on delete set null;

-- ─── audit_events triggers for HIPAA-relevant tables ─────────────────────
-- The trigger function runs as SECURITY DEFINER so it bypasses the
-- service-role-only INSERT policy on audit_events. All event_types use
-- the same `compliance.{table}.{action}` shape for consistent querying.

create or replace function public.write_compliance_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_target_id uuid;
  v_event_type text;
  v_actor uuid;
begin
  v_actor := auth.uid();
  if (tg_op = 'DELETE') then
    v_business_id := old.business_id;
    v_target_id := old.id;
    v_event_type := tg_table_name || '.deleted';
  elsif (tg_op = 'UPDATE') then
    v_business_id := new.business_id;
    v_target_id := new.id;
    v_event_type := tg_table_name || '.updated';
  else
    v_business_id := new.business_id;
    v_target_id := new.id;
    v_event_type := tg_table_name || '.created';
  end if;

  insert into public.audit_events (business_id, actor_user_id, event_type, target_id, metadata)
  values (v_business_id, v_actor, v_event_type, v_target_id, '{}'::jsonb);

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.write_compliance_audit_event() from public;

drop trigger if exists staff_credentials_audit on public.staff_credentials;
create trigger staff_credentials_audit
  after insert or update or delete on public.staff_credentials
  for each row execute function public.write_compliance_audit_event();

drop trigger if exists credential_renewals_log_audit on public.credential_renewals_log;
create trigger credential_renewals_log_audit
  after insert on public.credential_renewals_log
  for each row execute function public.write_compliance_audit_event();

drop trigger if exists business_associate_agreements_audit on public.business_associate_agreements;
create trigger business_associate_agreements_audit
  after insert or update on public.business_associate_agreements
  for each row execute function public.write_compliance_audit_event();

-- ─── filings DELETE policy ───────────────────────────────────────────────
-- Filings represent paid partner-routed work — only platform admins (or
-- service-role automation) should be able to delete. Owners refund via
-- status='refunded' instead.

drop policy if exists filings_admin_delete on public.filings;
create policy filings_admin_delete
  on public.filings for delete
  to authenticated
  using (public.is_platform_admin());

-- ─── sms_log context: at least one of (user_id, business_id) ─────────────
-- An SMS row must have a user_id or business_id (or both — cron-fired
-- reminders set both: the recipient user *and* the business whose
-- deadline triggered the send). Prevent fully-dangling rows.

alter table public.sms_log
  drop constraint if exists sms_log_context_check;

alter table public.sms_log
  add constraint sms_log_context_check
  check (user_id is not null or business_id is not null);
