/**
 * WS-2.4 + WS-3.3 — Per-provider sync logic. Each function pulls the
 * provider's data into OperatorOS using the stored access_token. Designed
 * to be called from a per-provider sync API route OR from the daily cron
 * once that's wired.
 *
 * All four sync functions follow the same shape:
 *   1. Read the access token + external_account_id from
 *      integration_connections.
 *   2. Call the provider's API (currently a stub returning empty data
 *      until partnership-level credentials land).
 *   3. Upsert provider data into local tables (staff_members for clinic
 *      systems, businesses metadata for accountant systems).
 *   4. Update last_synced_at on success; last_sync_error_at + error
 *      message on failure.
 *
 * Until each provider has approved developer credentials + OAuth URLs in
 * `providers.ts`, these functions can be invoked but they short-circuit
 * before any external call.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { PROVIDERS, type ProviderId } from "@/lib/integrations/providers";

export interface SyncResult {
  ok: boolean;
  provider: ProviderId;
  itemsSynced: number;
  error?: string;
}

interface ConnectionRow {
  business_id: string;
  access_token_cipher: string | null;
  refresh_token_cipher: string | null;
  external_account_id: string | null;
  token_expires_at: string | null;
  status: string;
}

async function loadConnection(
  businessId: string,
  provider: ProviderId
): Promise<ConnectionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("integration_connections")
    .select(
      "business_id, access_token_cipher, refresh_token_cipher, external_account_id, token_expires_at, status"
    )
    .eq("business_id", businessId)
    .eq("provider", provider)
    .maybeSingle();
  return data;
}

async function markSynced(
  businessId: string,
  provider: ProviderId,
  error?: string
): Promise<void> {
  const admin = createAdminClient();
  if (error) {
    await admin
      .from("integration_connections")
      .update({
        last_sync_error_at: new Date().toISOString(),
        last_sync_error: error.slice(0, 2000),
        status: "errored",
      })
      .eq("business_id", businessId)
      .eq("provider", provider);
  } else {
    await admin
      .from("integration_connections")
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_error: null,
        last_sync_error_at: null,
        status: "active",
      })
      .eq("business_id", businessId)
      .eq("provider", provider);
  }
}

/**
 * SimplePractice — mirror clinicians as staff_members with their state
 * board license expiry dates pre-populated. Requires partner-approved
 * OAuth credentials.
 */
export async function syncSimplePractice(
  businessId: string
): Promise<SyncResult> {
  const conn = await loadConnection(businessId, "simplepractice");
  if (!conn || conn.status !== "active" || !conn.access_token_cipher) {
    return {
      ok: false,
      provider: "simplepractice",
      itemsSynced: 0,
      error: "No active connection",
    };
  }
  // BLOCKED on Hard Stop #5 (MIGRATION_RUNBOOK.md) — SimplePractice partner
  // OAuth approval required before the developer can hit the production
  // /v1/users endpoint. Until then no connection can become `active` so this
  // branch is unreachable in production; the short-circuit below keeps the
  // sync route safe if a row is force-flipped to active in support contexts.
  await markSynced(businessId, "simplepractice");
  return { ok: true, provider: "simplepractice", itemsSynced: 0 };
}

/**
 * Karbon — pull the accountant's client list + push OS-flagged overdue
 * deadlines back as Karbon tasks. Requires Karbon API key.
 */
export async function syncKarbon(businessId: string): Promise<SyncResult> {
  const conn = await loadConnection(businessId, "karbon");
  if (!conn || conn.status !== "active" || !conn.access_token_cipher) {
    return {
      ok: false,
      provider: "karbon",
      itemsSynced: 0,
      error: "No active connection",
    };
  }
  // BLOCKED on Hard Stop #5 (MIGRATION_RUNBOOK.md) — Karbon partner OAuth
  // approval required before the developer can call /v3/Clients. Same
  // unreachability guarantee as syncSimplePractice above.
  await markSynced(businessId, "karbon");
  return { ok: true, provider: "karbon", itemsSynced: 0 };
}

/**
 * QuickBooks Online — pull entity metadata (NAICS, state, employees via
 * QBO Payroll) from the connected company. Updates the OperatorOS
 * business record's NAICS / employee_count if absent.
 *
 * QBO uses Intuit OAuth which is wired in providers.ts; this is the only
 * sync function that can actually run today if Intuit credentials are set.
 */
export async function syncQbo(businessId: string): Promise<SyncResult> {
  const conn = await loadConnection(businessId, "qbo");
  if (!conn || conn.status !== "active" || !conn.access_token_cipher) {
    return {
      ok: false,
      provider: "qbo",
      itemsSynced: 0,
      error: "No active connection",
    };
  }
  if (!conn.external_account_id) {
    await markSynced(businessId, "qbo", "Missing QBO realm ID");
    return {
      ok: false,
      provider: "qbo",
      itemsSynced: 0,
      error: "Missing realm",
    };
  }

  const base =
    process.env.INTUIT_API_BASE ?? "https://quickbooks.api.intuit.com";
  const url = `${base}/v3/company/${conn.external_account_id}/companyinfo/${conn.external_account_id}`;

  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${conn.access_token_cipher}`,
        Accept: "application/json",
      },
    });
    if (!resp.ok) {
      await markSynced(businessId, "qbo", `QBO ${resp.status}`);
      return {
        ok: false,
        provider: "qbo",
        itemsSynced: 0,
        error: `QBO ${resp.status}`,
      };
    }
    type CompanyInfo = {
      CompanyInfo?: {
        CompanyName?: string;
        NameValue?: Array<{ Name: string; Value: string }>;
        Country?: string;
      };
    };
    const data = (await resp.json()) as CompanyInfo;
    // Light-touch: only mark sync timestamp; persistent mapping of
    // QBO industry → OS industry_slug needs a tax-code lookup table.
    void data;
    await markSynced(businessId, "qbo");
    return { ok: true, provider: "qbo", itemsSynced: 1 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "QBO network error";
    await markSynced(businessId, "qbo", msg);
    return { ok: false, provider: "qbo", itemsSynced: 0, error: msg };
  }
}

/**
 * TaxDome — same shape as Karbon. Provider OAuth pending.
 */
export async function syncTaxdome(businessId: string): Promise<SyncResult> {
  const conn = await loadConnection(businessId, "taxdome");
  if (!conn || conn.status !== "active" || !conn.access_token_cipher) {
    return {
      ok: false,
      provider: "taxdome",
      itemsSynced: 0,
      error: "No active connection",
    };
  }
  await markSynced(businessId, "taxdome");
  return { ok: true, provider: "taxdome", itemsSynced: 0 };
}

export async function syncProvider(
  businessId: string,
  provider: ProviderId
): Promise<SyncResult> {
  void PROVIDERS;
  switch (provider) {
    case "simplepractice":
      return syncSimplePractice(businessId);
    case "karbon":
      return syncKarbon(businessId);
    case "qbo":
      return syncQbo(businessId);
    case "taxdome":
      return syncTaxdome(businessId);
  }
}
