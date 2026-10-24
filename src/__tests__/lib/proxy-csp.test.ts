import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";

// Regression: Next reads the nonce from the REQUEST's Content-Security-Policy
// header. Setting it only on the response left every script un-nonced, so
// 'strict-dynamic' blocked them all in production.
describe("proxy CSP", () => {
  it("forwards the CSP with the nonce on the request headers and sets the same CSP on the response", async () => {
    const res = await proxy(new NextRequest("http://localhost:3000/sign-in"));

    const responseCsp = res.headers.get("content-security-policy");
    expect(responseCsp).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);

    // NextResponse.next({ request }) exposes forwarded request headers as
    // x-middleware-request-<name> and the override list in x-middleware-override-headers.
    const overridden = res.headers.get("x-middleware-override-headers") ?? "";
    expect(overridden.split(",")).toContain("content-security-policy");
    const requestCsp = res.headers.get("x-middleware-request-content-security-policy");
    expect(requestCsp).toBe(responseCsp);

    const nonce = /'nonce-([^']+)'/.exec(requestCsp!)![1];
    expect(res.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
  });

  it("uses a different nonce for each request", async () => {
    const a = await proxy(new NextRequest("http://localhost:3000/"));
    const b = await proxy(new NextRequest("http://localhost:3000/"));
    expect(a.headers.get("x-middleware-request-content-security-policy")).not.toBe(
      b.headers.get("x-middleware-request-content-security-policy"),
    );
  });
});
