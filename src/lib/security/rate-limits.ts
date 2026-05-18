// Centralised rate-limit ceilings for every consumeRateLimit() / rate-limit
// RPC call in the codebase. One place to tune throttles when ops finds a
// vector or marketing wants to relax a paid surface. All values are
// (max, window_seconds) pairs.
//
// Add new keys here rather than inlining numbers at the call site — keeps
// the matrix scannable in code review and prevents silent drift between
// what the audit doc claims and what the route actually enforces.

export type RateLimit = { readonly max: number; readonly windowSeconds: number };

const HOUR = 60 * 60;

// Public/unauthenticated surfaces — per-IP.
export const WAITLIST_LIMIT: RateLimit = { max: 5, windowSeconds: HOUR };

// Token-authenticated accountant portal — per-connection or per-owner.
export const ACCOUNTANT_INVITE_LIMIT: RateLimit = { max: 10, windowSeconds: HOUR };
export const ACCOUNTANT_NOTE_LIMIT: RateLimit = { max: 30, windowSeconds: HOUR };
export const ACCOUNTANT_CORRECTION_LIMIT: RateLimit = { max: 10, windowSeconds: HOUR };

// Authenticated owner-scoped expensive operations.
export const BILLING_CHECKOUT_LIMIT: RateLimit = { max: 10, windowSeconds: HOUR };
export const AI_EXTRACT_LIMIT: RateLimit = { max: 10, windowSeconds: HOUR };
export const AI_SHARE_ACCOUNTANT_LIMIT: RateLimit = { max: 10, windowSeconds: HOUR };
export const SHARE_TOKEN_LIMIT: RateLimit = { max: 20, windowSeconds: HOUR };
export const INTEGRATIONS_SYNC_LIMIT: RateLimit = { max: 6, windowSeconds: HOUR };
