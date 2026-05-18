import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashToken } from "@/lib/security/token-hash";

type ResolvedRow = { data: unknown; error?: unknown };
type Plan = {
  connection?: ResolvedRow; // result of accountant_connections.maybeSingle()
  business?: ResolvedRow;
  deadlines?: ResolvedRow;
  otherRows?: ResolvedRow; // result of accountant_connections.order()
  noteRows?: ResolvedRow;
};

type EqCall = { table: string; column: string; value: unknown };

const insertSpy = vi.fn().mockResolvedValue({ data: null });
const updateSpy = vi.fn();
let currentPlan: Plan = {};
let eqCalls: EqCall[] = [];

function makeBuilder(table: string) {
  const update = () => {
    return {
      eq: () => {
        updateSpy(table);
        return Promise.resolve({ data: null });
      },
    };
  };

  const select = () => {
    const chain: Record<string, unknown> = {};
    chain.eq = (column: string, value: unknown) => {
      eqCalls.push({ table, column, value });
      return chain;
    };
    chain.is = () => chain;
    chain.gt = () => chain;
    chain.order = () => {
      if (table === "deadlines") return Promise.resolve(currentPlan.deadlines ?? { data: [] });
      if (table === "accountant_connections")
        return Promise.resolve(currentPlan.otherRows ?? { data: [] });
      return Promise.resolve({ data: [] });
    };
    chain.maybeSingle = () => {
      if (table === "accountant_connections")
        return Promise.resolve(currentPlan.connection ?? { data: null });
      if (table === "businesses") return Promise.resolve(currentPlan.business ?? { data: null });
      return Promise.resolve({ data: null });
    };
    // accountant_deadline_notes.select(...).eq(...) is awaited directly (no terminal).
    // Make the chain itself a thenable for that case.
    chain.then = (resolve: (v: ResolvedRow) => unknown) => {
      if (table === "accountant_deadline_notes")
        return Promise.resolve(currentPlan.noteRows ?? { data: [] }).then(resolve);
      return Promise.resolve({ data: null }).then(resolve);
    };
    return chain;
  };

  return {
    select,
    update,
    insert: (...args: unknown[]) => {
      insertSpy(table, args);
      return Promise.resolve({ data: null });
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => makeBuilder(table) }),
}));

import { loadAccountantPortalByToken } from "@/lib/security/accountant-by-token";

beforeEach(() => {
  currentPlan = {};
  eqCalls = [];
  insertSpy.mockClear();
  updateSpy.mockClear();
});

describe("loadAccountantPortalByToken", () => {
  it("returns null when no connection row matches the token", async () => {
    currentPlan = { connection: { data: null } };
    const result = await loadAccountantPortalByToken("missing");
    expect(result).toBeNull();
    expect(insertSpy).not.toHaveBeenCalled();
    // The connection lookup must use token_hash, not plaintext.
    const tokenEq = eqCalls.find(
      (c) => c.table === "accountant_connections" && c.column === "token_hash"
    );
    expect(tokenEq).toBeDefined();
    expect(tokenEq?.value).toBe(hashToken("missing"));
  });

  it("returns null when the connection is revoked", async () => {
    currentPlan = {
      connection: {
        data: {
          id: "conn-1",
          business_id: "biz-1",
          accountant_email: "cpa@example.com",
          accountant_name: "CPA",
          created_at: "2026-01-01T00:00:00Z",
          expires_at: "2099-01-01T00:00:00Z",
          revoked_at: "2026-04-01T00:00:00Z",
        },
      },
    };
    const result = await loadAccountantPortalByToken("revoked-token");
    expect(result).toBeNull();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("returns null when the connection is expired", async () => {
    currentPlan = {
      connection: {
        data: {
          id: "conn-1",
          business_id: "biz-1",
          accountant_email: "cpa@example.com",
          accountant_name: null,
          created_at: "2025-01-01T00:00:00Z",
          expires_at: "2025-04-01T00:00:00Z",
          revoked_at: null,
        },
      },
    };
    const result = await loadAccountantPortalByToken("expired-token");
    expect(result).toBeNull();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("returns null when business row is missing even though connection is valid", async () => {
    currentPlan = {
      connection: {
        data: {
          id: "conn-1",
          business_id: "biz-1",
          accountant_email: "cpa@example.com",
          accountant_name: null,
          created_at: "2026-01-01T00:00:00Z",
          expires_at: "2099-01-01T00:00:00Z",
          revoked_at: null,
        },
      },
      business: { data: null },
      deadlines: { data: [] },
      otherRows: { data: [] },
      noteRows: { data: [] },
    };
    const result = await loadAccountantPortalByToken("valid-token");
    expect(result).toBeNull();
  });

  it("returns the payload on the happy path and writes an access-log entry with hashed ip", async () => {
    currentPlan = {
      connection: {
        data: {
          id: "conn-1",
          business_id: "biz-1",
          accountant_email: "cpa@example.com",
          accountant_name: "Jane CPA",
          created_at: "2026-01-01T00:00:00Z",
          expires_at: "2099-01-01T00:00:00Z",
          revoked_at: null,
        },
      },
      business: {
        data: {
          id: "biz-1",
          name: "Acme Co",
          industry_slug: "restaurant",
          entity_type: "llc",
          employee_count: 12,
        },
      },
      deadlines: { data: [] },
      otherRows: { data: [] },
      noteRows: { data: [{ deadline_id: "d-1", note: "watch this one" }] },
    };

    const result = await loadAccountantPortalByToken("valid-token", {
      ip: "10.0.0.1",
      userAgent: "Mozilla/5.0",
    });

    expect(result).not.toBeNull();
    expect(result?.business.id).toBe("biz-1");
    expect(result?.connection.accountant_email).toBe("cpa@example.com");
    expect(result?.portfolio).toEqual([]);
    expect(result?.noteByDeadlineId).toEqual({ "d-1": "watch this one" });

    // Side effects: last_accessed_at bumped + access_log row inserted
    expect(updateSpy).toHaveBeenCalledWith("accountant_connections");
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const [logTable, [logRow]] = insertSpy.mock.calls[0] as [string, [Record<string, unknown>]];
    expect(logTable).toBe("accountant_access_log");
    expect(logRow.connection_id).toBe("conn-1");
    expect(logRow.action).toBe("view");
    expect(logRow.ip_hash).toMatch(/^[0-9a-f]{32}$/);
    expect(logRow.user_agent_fragment).toBe("Mozilla/5.0");
  });
});
