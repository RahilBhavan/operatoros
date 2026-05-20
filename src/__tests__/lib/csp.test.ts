import { describe, expect, it } from "vitest";

import { buildCsp, generateNonce } from "@/lib/security/csp";

describe("generateNonce", () => {
  it("returns a base64-encoded 16-byte nonce (24 chars w/ padding)", () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });

  it("produces a different nonce each call", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(generateNonce());
    expect(seen.size).toBe(100);
  });
});

describe("buildCsp", () => {
  it("embeds the nonce in script-src", () => {
    const csp = buildCsp("ABCDEF==", "prod");
    expect(csp).toContain("'nonce-ABCDEF=='");
  });

  it("drops 'unsafe-inline' from script-src in prod (the whole point of WS-H.6)", () => {
    const csp = buildCsp("X", "prod");
    const scriptDirective = csp.split(";").find((d) => d.trim().startsWith("script-src"))!;
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(scriptDirective).toContain("'strict-dynamic'");
  });

  it("keeps 'unsafe-eval' in dev for React Refresh / HMR", () => {
    const csp = buildCsp("X", "dev");
    const scriptDirective = csp.split(";").find((d) => d.trim().startsWith("script-src"))!;
    expect(scriptDirective).toContain("'unsafe-eval'");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
  });

  it("retains the existing connect-src allowlist (Supabase, Stripe, Anthropic)", () => {
    const csp = buildCsp("X", "prod");
    expect(csp).toContain("https://*.supabase.co");
    expect(csp).toContain("wss://*.supabase.co");
    expect(csp).toContain("https://api.stripe.com");
    expect(csp).toContain("https://api.anthropic.com");
  });

  it("retains frame-ancestors 'none' (no embedding)", () => {
    const csp = buildCsp("X", "prod");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
