/**
 * WS-H.3 — Centralised audit_events writer. Wraps the insert in try/catch +
 * structured stderr log so a transient DB failure never bubbles up to a
 * route handler. Use this everywhere instead of `await admin.from("audit_events").insert(...)`
 * to guarantee a uniform failure signal.
 *
 * NOTE: this writer never throws. The original behaviour at most call sites
 * was fire-and-forget; this preserves that semantic but adds an error log
 * when the insert fails (previously silent).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type AuditEventInsert =
  Database["public"]["Tables"]["audit_events"]["Insert"];

export async function writeAuditEvent(
  admin: SupabaseClient<Database>,
  row: AuditEventInsert
): Promise<{ ok: boolean }> {
  try {
    const { error } = await admin.from("audit_events").insert(row);
    if (error) {
      console.error("[audit] insert failed", {
        event_type: row.event_type,
        business_id: row.business_id,
        actor_user_id: row.actor_user_id,
        target_id: row.target_id,
        code: error.code,
        message: error.message,
      });
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[audit] insert threw", {
      event_type: row.event_type,
      business_id: row.business_id,
      actor_user_id: row.actor_user_id,
      target_id: row.target_id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false };
  }
}
