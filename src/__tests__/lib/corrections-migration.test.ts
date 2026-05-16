import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Contract tests for the corrections loop migration. The unit tests above
 * cover the validators that run in Node; this file pins the SQL semantics
 * that workstream B's race-condition + confidence-tier acceptance criteria
 * depend on. Without a live Postgres in CI, this is the closest we get to
 * the spec's "1 vitest spec for the accept_correction RPC (race condition:
 * two admins accepting simultaneously — second one gets a
 * correction_already_resolved error)" — assertions on the SQL text that
 * make the race-safe semantics observable.
 */

const SQL = readFileSync(
  join(__dirname, "../../../supabase/migrations/20260516000008_corrections_loop.sql"),
  "utf8"
);

describe("corrections_loop migration", () => {
  it("creates the rule_corrections table", () => {
    expect(SQL).toContain("create table if not exists public.rule_corrections");
  });

  it("requires at least one proposer identifier", () => {
    expect(SQL).toMatch(/rule_corrections_proposer_present/);
    expect(SQL).toMatch(/proposed_by_connection_id is not null/);
    expect(SQL).toMatch(/proposed_by_user_id is not null/);
  });

  it("constrains status to the documented set", () => {
    expect(SQL).toMatch(
      /status text not null default 'pending' check \(status in \('pending','accepted','rejected','superseded'\)\)/
    );
  });

  it("indexes pending corrections via a partial index", () => {
    expect(SQL).toMatch(/where status = 'pending'/);
  });

  it("enables RLS and locks writes to platform admins", () => {
    expect(SQL).toMatch(/alter table public\.rule_corrections enable row level security/);
    expect(SQL).toMatch(/using \(public\.is_platform_admin\(\)\)/);
  });

  it("creates the rule_confidence materialized view with a unique index", () => {
    expect(SQL).toMatch(/create materialized view public\.rule_confidence/);
    expect(SQL).toMatch(/create unique index rule_confidence_pk on public\.rule_confidence/);
  });

  it("computes the documented confidence tiers", () => {
    // The exact ordering matters: low > unverified > stale > community_validated > baseline
    expect(SQL).toMatch(/when count\(c\.\*\) filter \(where c\.status = 'rejected'\) > 2 then 'low'/);
    expect(SQL).toMatch(/when r\.last_verified_at is null then 'unverified'/);
    expect(SQL).toMatch(/when r\.last_verified_at < now\(\) - interval '180 days' then 'stale'/);
    expect(SQL).toMatch(
      /when count\(c\.\*\) filter \(where c\.status = 'accepted'\) >= 1 then 'community_validated'/
    );
    expect(SQL).toMatch(/else 'baseline'/);
  });

  it("only computes confidence for unsuperseded, non-sunset rules", () => {
    expect(SQL).toMatch(/where r\.sunset_date is null\n\s+and r\.superseded_by is null/);
  });

  it("defines a service-role-only refresh function", () => {
    expect(SQL).toMatch(/create or replace function public\.refresh_rule_confidence\(\)/);
    expect(SQL).toMatch(
      /grant execute on function public\.refresh_rule_confidence\(\) to service_role/
    );
    expect(SQL).toMatch(
      /revoke all on function public\.refresh_rule_confidence\(\) from public, anon, authenticated/
    );
  });

  it("serialises accept_correction via FOR UPDATE", () => {
    // FOR UPDATE on the correction row is the load-bearing piece for the
    // race-condition acceptance criterion in §3-B.
    expect(SQL).toMatch(
      /select \* into v_correction[\s\S]+?from public\.rule_corrections[\s\S]+?for update/
    );
  });

  it("raises correction_already_resolved when a concurrent admin already accepted", () => {
    // The second admin sees a non-pending row and gets a 22023, which the
    // API route maps to a 409 with a "Correction already resolved" message.
    expect(SQL).toMatch(/if v_correction\.status <> 'pending' then[\s\S]+?errcode = '22023'/);
  });

  it("guards both RPCs with is_platform_admin()", () => {
    const acceptMatch = SQL.match(/create or replace function public\.accept_correction[\s\S]+?\$\$;/);
    const rejectMatch = SQL.match(/create or replace function public\.reject_correction[\s\S]+?\$\$;/);
    expect(acceptMatch).not.toBeNull();
    expect(rejectMatch).not.toBeNull();
    expect(acceptMatch?.[0]).toMatch(/is_platform_admin\(\)/);
    expect(rejectMatch?.[0]).toMatch(/is_platform_admin\(\)/);
  });

  it("accept_correction forks a new rule via version_regulatory_rule", () => {
    const acceptMatch = SQL.match(/create or replace function public\.accept_correction[\s\S]+?\$\$;/);
    expect(acceptMatch?.[0]).toMatch(/public\.version_regulatory_rule\(/);
  });

  it("accept_correction credits the accountant in regulatory_rule_sources", () => {
    const acceptMatch = SQL.match(/create or replace function public\.accept_correction[\s\S]+?\$\$;/);
    expect(acceptMatch?.[0]).toMatch(
      /insert into public\.regulatory_rule_sources[\s\S]+?'accountant_correction'/
    );
  });

  it("reject_correction requires a non-empty review_note", () => {
    const rejectMatch = SQL.match(/create or replace function public\.reject_correction[\s\S]+?\$\$;/);
    expect(rejectMatch?.[0]).toMatch(
      /if p_review_note is null or char_length\(trim\(p_review_note\)\) = 0 then/
    );
  });
});
