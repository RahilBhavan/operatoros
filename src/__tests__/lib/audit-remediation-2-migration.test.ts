import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Contract tests for 20260518000013_audit_remediation.sql — the
 * follow-up migration that closes the 2026-05-18 PHI/HIPAA audit
 * findings.
 */

const SQL = readFileSync(
  join(
    __dirname,
    "../../../supabase/migrations/20260518000013_audit_remediation.sql"
  ),
  "utf8"
);

describe("audit_remediation_2 migration", () => {
  it("expands phi_access_log.action with create/update/delete", () => {
    expect(SQL).toMatch(/phi_access_log_action_check/);
    expect(SQL).toMatch(/create.*update.*delete/);
  });

  it("adds the staff_credential_id FK on phi_access_log", () => {
    expect(SQL).toMatch(
      /phi_access_log_staff_credential_id_fkey[\s\S]*staff_credentials\(id\)/
    );
    expect(SQL).toMatch(/on delete set null/);
  });

  it("ships a SECURITY DEFINER compliance audit-event writer", () => {
    expect(SQL).toMatch(/write_compliance_audit_event/);
    expect(SQL).toMatch(/security definer/);
    expect(SQL).toMatch(
      /revoke all on function public\.write_compliance_audit_event\(\) from public/
    );
  });

  it("wires triggers on the three HIPAA-relevant tables", () => {
    expect(SQL).toMatch(/staff_credentials_audit on public\.staff_credentials/);
    expect(SQL).toMatch(
      /credential_renewals_log_audit on public\.credential_renewals_log/
    );
    expect(SQL).toMatch(
      /business_associate_agreements_audit on public\.business_associate_agreements/
    );
  });

  it("adds an explicit filings DELETE policy", () => {
    expect(SQL).toMatch(/filings_admin_delete/);
    expect(SQL).toMatch(/is_platform_admin\(\)/);
  });

  it("constrains sms_log to require a user or business context", () => {
    expect(SQL).toMatch(/sms_log_context_check/);
    expect(SQL).toMatch(
      /user_id is not null or business_id is not null/
    );
  });
});
