/**
 * WS-2.4 + WS-3.3 — Provider registry for external integrations. Each
 * provider's OAuth client/secret + scopes are env-gated. If credentials
 * aren't set, the provider shows up in the UI as "Configure required —
 * contact admin" rather than as a broken button.
 *
 * Hard stop for the user: register OperatorOS as a developer app with each
 * provider, capture client_id + client_secret, set them in env, deploy.
 */

export type ProviderId = "simplepractice" | "karbon" | "qbo" | "taxdome";

export interface ProviderDef {
  id: ProviderId;
  label: string;
  description: string;
  workstream: string;
  // The well-known OAuth endpoints; provider docs are linked here.
  authUrl: string | null;
  tokenUrl: string | null;
  scopes: string[];
  envClientId: string;
  envClientSecret: string;
}

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  simplepractice: {
    id: "simplepractice",
    label: "SimplePractice",
    description:
      "Sync staff roster + license expiry from your SimplePractice account (healthcare).",
    workstream: "WS-2.4",
    // SimplePractice OAuth currently goes through a partner-developer
    // application. These URLs are placeholders until credentials land.
    authUrl: null,
    tokenUrl: null,
    scopes: ["staff:read", "clinicians:read"],
    envClientId: "SIMPLEPRACTICE_CLIENT_ID",
    envClientSecret: "SIMPLEPRACTICE_CLIENT_SECRET",
  },
  karbon: {
    id: "karbon",
    label: "Karbon",
    description:
      "Sync your accountant client portfolio + write OperatorOS-flagged deadlines back into Karbon as tasks.",
    workstream: "WS-3.3",
    authUrl: null,
    tokenUrl: null,
    scopes: ["read:clients", "write:tasks"],
    envClientId: "KARBON_CLIENT_ID",
    envClientSecret: "KARBON_CLIENT_SECRET",
  },
  qbo: {
    id: "qbo",
    label: "QuickBooks Online",
    description:
      "Pull entity metadata (NAICS, state, employee count via Payroll) to pre-seed deadlines for QBO clients.",
    workstream: "WS-3.3",
    authUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    scopes: ["com.intuit.quickbooks.accounting"],
    envClientId: "INTUIT_CLIENT_ID",
    envClientSecret: "INTUIT_CLIENT_SECRET",
  },
  taxdome: {
    id: "taxdome",
    label: "TaxDome",
    description:
      "Sync your accountant client portfolio from TaxDome (planned alternative to Karbon).",
    workstream: "WS-3.3",
    authUrl: null,
    tokenUrl: null,
    scopes: ["read:clients"],
    envClientId: "TAXDOME_CLIENT_ID",
    envClientSecret: "TAXDOME_CLIENT_SECRET",
  },
};

export function isProviderConfigured(p: ProviderDef): boolean {
  return Boolean(process.env[p.envClientId] && process.env[p.envClientSecret]);
}
