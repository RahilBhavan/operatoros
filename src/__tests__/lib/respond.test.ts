import { describe, it, expect, vi, afterEach } from "vitest";
import { dbError } from "@/lib/api/respond";

describe("dbError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs server-side but never echoes the postgres detail to the client", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const resp = dbError("test-route", {
      code: "23502",
      message: "null value in column \"business_id\" violates not-null constraint",
    });
    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.error).toMatch(/Failed to save record/i);
    expect(JSON.stringify(body)).not.toMatch(/business_id/);
    expect(JSON.stringify(body)).not.toMatch(/23502/);
    expect(spy).toHaveBeenCalled();
  });

  it("survives a null error payload", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const resp = dbError("test-route", null);
    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.error).toBeTruthy();
  });
});
