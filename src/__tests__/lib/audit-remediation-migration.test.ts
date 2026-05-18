import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Contract tests for the audit-remediation migration. Pins each major change
 * as a string-presence assertion so a future edit that drops a section
 * trips CI before it lands in a DB.
 */

const SQL = readFileSync(
  join(__dirname, "../../../supabase/migrations/20260517000002_audit_remediation.sql"),
  "utf8"
);

describe("audit_remediation migration", () => {
  it("adds the Stripe idempotency table", () => {
    expect(SQL).toMatch(/create table if not exists public\.stripe_received_events/);
  });

  it("locks down corrections RPCs to service_role only", () => {
    expect(SQL).toMatch(/revoke execute on function public\.accept_correction\(uuid\) from authenticated, anon/);
    expect(SQL).toMatch(/revoke execute on function public\.reject_correction\(uuid, text\) from authenticated, anon/);
    expect(SQL).toMatch(/revoke execute on function public\.version_regulatory_rule\(uuid, jsonb\) from authenticated, anon/);
  });

  it("adds cycle protection to regulatory_rules", () => {
    expect(SQL).toMatch(/regulatory_rules_no_self_supersede_chk/);
    expect(SQL).toMatch(/create or replace function public\.prevent_regulatory_rule_cycle/);
    expect(SQL).toMatch(/raise exception 'cyclic supersede chain'/);
  });

  it("adds an explicit deny policy on accountant_deadline_notes", () => {
    expect(SQL).toMatch(/deny anon and authenticated direct access/);
  });

  it("normalizes one-time and constrains deadlines.frequency", () => {
    expect(SQL).toMatch(/update public\.deadlines set frequency = 'one_time' where frequency = 'one-time'/);
    expect(SQL).toMatch(/deadlines_frequency_chk/);
  });

  it("adds a unique constraint on documents (business_id, file_path)", () => {
    expect(SQL).toMatch(/documents_business_id_file_path_uniq/);
  });

  it("switches user FKs to ON DELETE SET NULL", () => {
    expect(SQL).toMatch(/audit_log_user_id_fkey[\s\S]+?on delete set null/);
    expect(SQL).toMatch(/documents_uploaded_by_fkey[\s\S]+?on delete set null/);
    expect(SQL).toMatch(/deadlines_assigned_to_fkey[\s\S]+?on delete set null/);
  });

  it("replaces reminder_log uniqueness with a partial index on sent", () => {
    expect(SQL).toMatch(/reminder_log_sent_uniq[\s\S]+?where status = 'sent'/);
  });

  it("guards auth_rate_limits with an advisory xact lock", () => {
    expect(SQL).toMatch(/pg_advisory_xact_lock\(hashtext\(p_key\)\)/);
  });

  it("adds cleanup_auth_rate_limits, service_role only", () => {
    expect(SQL).toMatch(/create or replace function public\.cleanup_auth_rate_limits/);
    expect(SQL).toMatch(/grant execute on function public\.cleanup_auth_rate_limits\(\) to service_role/);
  });

  it("rate-limits unsubscribe_reminders and returns constant true", () => {
    expect(SQL).toMatch(/try_consume_auth_rate_limit\(\s*'unsub:'/);
  });

  it("enforces invited_email match in claim_platform_admin_invite", () => {
    expect(SQL).toMatch(/lower\(v_caller_email\) <> lower\(v_email\)/);
    expect(SQL).toMatch(/errcode = '42501'/);
  });

  it("hashes share/accountant/admin-invite tokens and drops plaintext", () => {
    expect(SQL).toMatch(/share_tokens_token_hash_key/);
    expect(SQL).toMatch(/accountant_connections_token_hash_key/);
    expect(SQL).toMatch(/platform_admin_invites_token_hash_key/);
    expect(SQL).toMatch(/alter table public\.share_tokens drop column if exists token/);
  });

  it("intentionally leaves unsubscribe_token plaintext (cron rebuilds links)", () => {
    expect(SQL).not.toMatch(/reminder_preferences_unsubscribe_token_hash_key/);
    expect(SQL).not.toMatch(/alter table public\.reminder_preferences drop column if exists unsubscribe_token/);
  });

  it("re-keys accountant_deadline_notes by connection_id", () => {
    expect(SQL).toMatch(/alter table public\.accountant_deadline_notes\s+add column if not exists connection_id/);
    expect(SQL).toMatch(/accountant_deadline_notes_unique[\s\S]+?\(deadline_id, connection_id\)/);
    expect(SQL).toMatch(/alter table public\.accountant_deadline_notes drop column if exists accountant_token/);
  });

  it("makes claim_platform_admin_invite query by token_hash (not the dropped plaintext token)", () => {
    expect(SQL).toMatch(/where token_hash = encode\(sha256\(coalesce\(p_token, ''\)::bytea\), 'hex'\)/);
  });
});
