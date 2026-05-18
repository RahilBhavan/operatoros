import { describe, it, expect, vi } from "vitest";
import {
  generateInviteCode,
  loadActiveInviteLink,
  incrementInviteLinkCounter,
  INVITE_CODE_COOKIE,
  INVITE_CODE_TTL_SECONDS,
} from "@/lib/viral-attribution";

describe("generateInviteCode", () => {
  it("returns a 12-char hex string", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[0-9a-f]{12}$/);
  });

  it("returns unique codes across 1000 calls (collision-free at this volume)", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) codes.add(generateInviteCode());
    expect(codes.size).toBe(1000);
  });
});

describe("cookie constants", () => {
  it("matches the migration column name + roadmap TTL", () => {
    expect(INVITE_CODE_COOKIE).toBe("invite_code");
    expect(INVITE_CODE_TTL_SECONDS).toBe(60 * 60);
  });
});

function mockAdminWith(rows: Array<Record<string, unknown>>) {
  type Builder = {
    select: (...args: unknown[]) => Builder;
    eq: (...args: unknown[]) => Builder;
    is: (...args: unknown[]) => Builder;
    not: (...args: unknown[]) => Builder;
    update: (patch: Record<string, unknown>) => Builder;
    maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: null }>;
  };
  const builder: Builder = {
    select: () => builder,
    eq: () => builder,
    is: () => builder,
    not: () => builder,
    update: () => builder,
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
  };
  return {
    from: vi.fn(() => builder),
  } as unknown as Parameters<typeof loadActiveInviteLink>[0];
}

describe("loadActiveInviteLink", () => {
  it("rejects empty or out-of-range codes without querying", async () => {
    const admin = mockAdminWith([]);
    expect(await loadActiveInviteLink(admin, "")).toBeNull();
    expect(await loadActiveInviteLink(admin, "abc")).toBeNull(); // <4 chars
    expect(await loadActiveInviteLink(admin, "x".repeat(65))).toBeNull();
  });

  it("returns the row when present", async () => {
    const fakeRow = {
      id: "link-1",
      accountant_id: "acc-1",
      code: "abc123",
      revoked_at: null,
    };
    const admin = mockAdminWith([fakeRow]);
    const got = await loadActiveInviteLink(admin, "abc123");
    expect(got).toEqual(fakeRow);
  });

  it("trims whitespace before lookup", async () => {
    const fakeRow = {
      id: "link-1",
      accountant_id: "acc-1",
      code: "abc123",
      revoked_at: null,
    };
    const admin = mockAdminWith([fakeRow]);
    const got = await loadActiveInviteLink(admin, "  abc123  ");
    expect(got).toEqual(fakeRow);
  });
});

describe("incrementInviteLinkCounter", () => {
  it("returns ok:false when the link does not exist", async () => {
    const admin = mockAdminWith([]);
    const result = await incrementInviteLinkCounter(
      admin,
      "missing",
      "signups_count"
    );
    expect(result.ok).toBe(false);
  });

  it("increments from null/missing to 1", async () => {
    const admin = mockAdminWith([{ signups_count: null }]);
    const result = await incrementInviteLinkCounter(
      admin,
      "link-1",
      "signups_count"
    );
    expect(result).toEqual({ ok: true, newValue: 1 });
  });

  it("increments from existing value", async () => {
    const admin = mockAdminWith([{ paid_conversions_count: 4 }]);
    const result = await incrementInviteLinkCounter(
      admin,
      "link-1",
      "paid_conversions_count"
    );
    expect(result).toEqual({ ok: true, newValue: 5 });
  });
});
