import { test, expect } from "@playwright/test";

test.describe("Sign-in page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
  });

  test("shows email and password inputs", async ({ page }) => {
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("shows Sign in button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows link to sign-up page", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });

  test("shows validation error for invalid credentials", async ({ page }) => {
    await page.getByRole("textbox", { name: /email/i }).fill("bad@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("text=/invalid|incorrect|error/i")).toBeVisible({ timeout: 8000 });
  });
});
