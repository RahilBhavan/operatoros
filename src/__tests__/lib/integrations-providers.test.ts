import { describe, it, expect, afterEach } from "vitest";
import {
  PROVIDERS,
  isProviderConfigured,
  type ProviderId,
} from "@/lib/integrations/providers";

describe("integrations PROVIDERS registry", () => {
  it("exposes the four provider ids with required envClient keys", () => {
    const ids = Object.keys(PROVIDERS) as ProviderId[];
    expect(ids).toEqual(
      expect.arrayContaining(["simplepractice", "karbon", "qbo", "taxdome"])
    );
    for (const id of ids) {
      const p = PROVIDERS[id];
      expect(p.id).toBe(id);
      expect(p.envClientId.startsWith("")).toBe(true);
      expect(p.envClientSecret.startsWith("")).toBe(true);
      expect(Array.isArray(p.scopes)).toBe(true);
    }
  });

  it("only QBO has live OAuth URLs in this build", () => {
    expect(PROVIDERS.qbo.authUrl).not.toBeNull();
    expect(PROVIDERS.qbo.tokenUrl).not.toBeNull();
    expect(PROVIDERS.simplepractice.authUrl).toBeNull();
    expect(PROVIDERS.karbon.authUrl).toBeNull();
    expect(PROVIDERS.taxdome.authUrl).toBeNull();
  });
});

describe("isProviderConfigured", () => {
  const originalId = process.env.INTUIT_CLIENT_ID;
  const originalSecret = process.env.INTUIT_CLIENT_SECRET;

  afterEach(() => {
    if (originalId === undefined) delete process.env.INTUIT_CLIENT_ID;
    else process.env.INTUIT_CLIENT_ID = originalId;
    if (originalSecret === undefined) delete process.env.INTUIT_CLIENT_SECRET;
    else process.env.INTUIT_CLIENT_SECRET = originalSecret;
  });

  it("requires both id and secret", () => {
    delete process.env.INTUIT_CLIENT_ID;
    delete process.env.INTUIT_CLIENT_SECRET;
    expect(isProviderConfigured(PROVIDERS.qbo)).toBe(false);

    process.env.INTUIT_CLIENT_ID = "id_test";
    expect(isProviderConfigured(PROVIDERS.qbo)).toBe(false);

    process.env.INTUIT_CLIENT_SECRET = "sk_test";
    expect(isProviderConfigured(PROVIDERS.qbo)).toBe(true);
  });
});
