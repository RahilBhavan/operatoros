import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashToken } from "@/lib/security/token-hash";

// Build a minimal mock that mirrors the chained query builder shape used in
// share-by-token: .from(t).select(...).eq(col,val).gt(...).is(...).maybeSingle().
// Each chained method returns the same builder; the terminal method (maybeSingle
// or order) returns a {data} promise resolved from a queue keyed by table+verb.
// .eq calls are captured so tests can assert lookups happen by token_hash.

type ResolvedRow = { data: unknown; error?: unknown };
type Plan = {
  tokenRow?: ResolvedRow;
  businessRow?: ResolvedRow;
  deadlinesRow?: ResolvedRow;
};

type EqCall = { table: string; column: string; value: unknown };

function makeMockSupabase(
  plan: Plan,
  rpcSpy: ReturnType<typeof vi.fn>,
  eqCalls: EqCall[]
) {
  function buildSelect(table: string) {
    let mode: "token" | "business" | "deadlines" = "token";
    if (table === "businesses") mode = "business";
    if (table === "deadlines") mode = "deadlines";

    const builder = {
      select: () => builder,
      eq: (column: string, value: unknown) => {
        eqCalls.push({ table, column, value });
        return builder;
      },
      gt: () => builder,
      is: () => builder,
      order: () => {
        if (mode === "deadlines") {
          return Promise.resolve(plan.deadlinesRow ?? { data: [] });
        }
        return Promise.resolve({ data: null });
      },
      maybeSingle: () => {
        if (mode === "token") return Promise.resolve(plan.tokenRow ?? { data: null });
        if (mode === "business") return Promise.resolve(plan.businessRow ?? { data: null });
        return Promise.resolve({ data: null });
      },
    };
    return builder;
  }

  return {
    from: (table: string) => buildSelect(table),
    rpc: rpcSpy,
  };
}

const rpcSpy = vi.fn().mockResolvedValue({ data: null });
let currentPlan: Plan = {};
let eqCalls: EqCall[] = [];

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => makeMockSupabase(currentPlan, rpcSpy, eqCalls),
}));

import { loadShareViewByToken } from "@/lib/security/share-by-token";

beforeEach(() => {
  rpcSpy.mockClear();
  currentPlan = {};
  eqCalls = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadShareViewByToken", () => {
  it("returns null when the token row is absent (expired/revoked/missing)", async () => {
    currentPlan = { tokenRow: { data: null } };
    const result = await loadShareViewByToken("any-token");
    expect(result).toBeNull();
    // Lookup must be by token_hash (sha256 of plaintext), never plaintext.
    const tokenEq = eqCalls.find((c) => c.table === "share_tokens");
    expect(tokenEq?.column).toBe("token_hash");
    expect(tokenEq?.value).toBe(hashToken("any-token"));
  });

  it("returns null when the business linked to the token is missing", async () => {
    currentPlan = {
      tokenRow: {
        data: {
          business_id: "biz-1",
          expires_at: "2099-01-01T00:00:00Z",
          label: "Q1 audit",
          view_count: 0,
          revoked_at: null,
        },
      },
      businessRow: { data: null },
    };
    const result = await loadShareViewByToken("good-token");
    expect(result).toBeNull();
  });

  it("returns a payload on the happy path and omits record_share_view when viewer is undefined", async () => {
    currentPlan = {
      tokenRow: {
        data: {
          business_id: "biz-1",
          expires_at: "2099-01-01T00:00:00Z",
          label: "Q1 audit",
          view_count: 3,
          revoked_at: null,
        },
      },
      businessRow: { data: { id: "biz-1", name: "Acme Co" } },
      deadlinesRow: {
        data: [
          {
            id: "d1",
            name: "Form 941",
            deadline_type: "tax",
            due_date: "2026-04-30",
            status: "upcoming",
            governing_agency: "IRS",
            severity_tier: "critical",
            penalty_estimate_cents: 50000,
            source_url: "https://irs.gov/941",
            statute_citation: "IRC §6651",
          },
        ],
      },
    };
    const result = await loadShareViewByToken("good-token");
    expect(result).not.toBeNull();
    expect(result?.business).toEqual({ id: "biz-1", name: "Acme Co" });
    expect(result?.deadlines).toHaveLength(1);
    expect(result?.label).toBe("Q1 audit");
    expect(result?.view_count).toBe(3);
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("fires record_share_view when a viewer is provided, with hashed ip and truncated UA", async () => {
    currentPlan = {
      tokenRow: {
        data: {
          business_id: "biz-1",
          expires_at: "2099-01-01T00:00:00Z",
          label: null,
          view_count: 0,
          revoked_at: null,
        },
      },
      businessRow: { data: { id: "biz-1", name: "Acme Co" } },
      deadlinesRow: { data: [] },
    };
    const longUa = "A".repeat(500);
    await loadShareViewByToken("good-token", { ip: "1.2.3.4", userAgent: longUa });
    // RPC is fire-and-forget — settle the microtask queue
    await Promise.resolve();
    expect(rpcSpy).toHaveBeenCalledTimes(1);
    const [, args] = rpcSpy.mock.calls[0];
    expect(args.p_token).toBe("good-token");
    // sha256 hashed to 32 hex chars (per share-by-token.hashIp)
    expect(args.p_ip_hash).toMatch(/^[0-9a-f]{32}$/);
    // User-agent truncated to 120 chars
    expect(args.p_user_agent).toHaveLength(120);
  });

  it("passes null ip_hash when viewer has no ip", async () => {
    currentPlan = {
      tokenRow: {
        data: {
          business_id: "biz-1",
          expires_at: "2099-01-01T00:00:00Z",
          label: null,
          view_count: 0,
          revoked_at: null,
        },
      },
      businessRow: { data: { id: "biz-1", name: "Acme Co" } },
      deadlinesRow: { data: [] },
    };
    await loadShareViewByToken("good-token", { ip: null, userAgent: "ua-x" });
    await Promise.resolve();
    expect(rpcSpy).toHaveBeenCalledTimes(1);
    const [, args] = rpcSpy.mock.calls[0];
    expect(args.p_ip_hash).toBeNull();
    expect(args.p_user_agent).toBe("ua-x");
  });
});
