import { test, expect } from "@playwright/test";

// Run against a PRODUCTION build (`npm run build && npm start`, then
// PLAYWRIGHT_BASE_URL=http://localhost:<port>). The dev server's CSP differs.
// Regression for the bug where the nonce never reached Next's scripts, so the
// CSP blocked every script and React never hydrated.
for (const path of ["/", "/sign-in", "/sign-up"]) {
  test(`${path} hydrates with zero CSP violations`, async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (m) => {
      if (/content security policy|violates the following/i.test(m.text())) violations.push(m.text());
    });
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        console.error(`Content Security Policy violation: ${e.violatedDirective} ${e.blockedURI}`);
      });
    });

    await page.goto(path, { waitUntil: "networkidle" });

    const scripts = await page.$$eval("script[src]", (els) => els.map((s) => (s as HTMLScriptElement).nonce || s.getAttribute("nonce")));
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.every(Boolean)).toBe(true);

    // React attaches __reactFiber$ keys to DOM nodes only once hydrated.
    const hydrated = await page.evaluate(() =>
      Object.keys(document.body.firstElementChild ?? {}).some((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactContainer$")) ||
      Object.keys(document.body).some((k) => k.startsWith("__reactContainer$")) ||
      Object.keys(document.documentElement).some((k) => k.startsWith("__reactContainer$")),
    );
    expect(hydrated).toBe(true);
    expect(violations).toEqual([]);
  });
}

test("sign-in form submit handler runs after hydration", async ({ page }) => {
  await page.goto("/sign-in", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: /email/i }).fill("bad@example.com");
  await page.locator('input[type="password"]').fill("wrongpassword");
  await page.getByRole("button", { name: /sign in/i }).click();
  // Without hydration the form would do a native GET submit and reload with
  // the credentials in the URL; with it, React handles the event.
  await expect(page).toHaveURL(/\/sign-in$/);
  // React's handler sets the loading state ("Signing in…") or, once the auth
  // call returns, an error message. Which one is visible depends on the
  // backend, so accept either; a non-hydrated page shows neither.
  await expect(
    page.getByRole("button", { name: /signing in/i }).or(page.locator("text=/invalid|incorrect|error|too many/i").first()),
  ).toBeVisible({ timeout: 10000 });
});
