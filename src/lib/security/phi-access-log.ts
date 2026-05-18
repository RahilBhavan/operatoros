import { createAdminClient } from "@/lib/supabase/admin";

// Mirror of the phi_access_log.action CHECK constraint. Read actions are
// the original five; create/update/delete were added by
// 20260518000013_audit_remediation.sql so that every PHI mutation also
// lands in the access log (HIPAA requires audit of writes, not just
// reads).
export type PhiAccessAction =
  | "view"
  | "download"
  | "list"
  | "share"
  | "export"
  | "create"
  | "update"
  | "delete";

interface LogParams {
  businessId: string;
  action: PhiAccessAction;
  userId?: string | null;
  accountantConnectionId?: string | null;
  shareTokenId?: string | null;
  documentId?: string | null;
  deadlineId?: string | null;
  staffCredentialId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Append-only PHI access log. Required by WS-2.2 HIPAA scaffolds; the
 * record exists for every read of a deadline or document for a
 * business in a healthcare vertical (the caller decides whether the
 * business qualifies — this helper just writes).
 *
 * Fire-and-forget by design — never throw. Failure to log is logged to
 * stderr but does not break the user-facing operation. Production
 * deployments should monitor for sustained insert failures and treat
 * those as a breach-class incident per the BAA.
 */
export async function logPhiAccess(params: LogParams): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("phi_access_log").insert({
      business_id: params.businessId,
      action: params.action,
      user_id: params.userId ?? null,
      accountant_connection_id: params.accountantConnectionId ?? null,
      share_token_id: params.shareTokenId ?? null,
      document_id: params.documentId ?? null,
      deadline_id: params.deadlineId ?? null,
      staff_credential_id: params.staffCredentialId ?? null,
      ip: params.ip ?? null,
      user_agent: params.userAgent ?? null,
    });
  } catch (err) {
    console.error("[phi-access-log] insert failed", err);
  }
}
