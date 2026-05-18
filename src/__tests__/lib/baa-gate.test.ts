import { describe, it, expect } from "vitest";
import { checkBaaForPhi, requiresBaa } from "@/lib/security/baa-gate";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("requiresBaa", () => {
  it("flags only healthcare-classified industry slugs", () => {
    expect(requiresBaa("healthcare")).toBe(true);
    expect(requiresBaa("construction")).toBe(false);
    expect(requiresBaa(null)).toBe(false);
    expect(requiresBaa(undefined)).toBe(false);
    expect(requiresBaa("")).toBe(false);
  });
});

function mockSupabase(baaRow: { id: string } | null): SupabaseClient {
  // Minimal chainable mock: from().select().eq().is().limit().maybeSingle()
  const builder = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    is() {
      return this;
    },
    limit() {
      return this;
    },
    async maybeSingle() {
      return { data: baaRow, error: null };
    },
  };
  return {
    from() {
      return builder;
    },
  } as unknown as SupabaseClient;
}

describe("checkBaaForPhi", () => {
  it("returns null for non-healthcare regardless of BAA presence", async () => {
    const result = await checkBaaForPhi(mockSupabase(null), {
      businessId: "biz_123",
      industrySlug: "retail",
    });
    expect(result).toBeNull();
  });

  it("returns null when healthcare tenant has an active BAA", async () => {
    const result = await checkBaaForPhi(mockSupabase({ id: "baa_1" }), {
      businessId: "biz_123",
      industrySlug: "healthcare",
    });
    expect(result).toBeNull();
  });

  it("returns 409 when healthcare tenant has no BAA on file", async () => {
    const result = await checkBaaForPhi(mockSupabase(null), {
      businessId: "biz_123",
      industrySlug: "healthcare",
    });
    expect(result).not.toBeNull();
    expect(result?.status).toBe(409);
    expect(result?.error).toMatch(/Business Associate Agreement/);
  });
});
