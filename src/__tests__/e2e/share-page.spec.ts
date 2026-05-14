import { test, expect } from "@playwright/test";

test.describe("Public share page", () => {
  test("shows 404 or error for unknown token", async ({ page }) => {
    const response = await page.goto("/share/nonexistent-token-xyz");
    // Either a 404 page or the app renders an error state
    const status = response?.status() ?? 200;
    const is404 = status === 404;
    const hasErrorText = await page
      .locator("text=/not found|no deadlines|expired|invalid/i")
      .isVisible()
      .catch(() => false);
    expect(is404 || hasErrorText).toBe(true);
  });
});
