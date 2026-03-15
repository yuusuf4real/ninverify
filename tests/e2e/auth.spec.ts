import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/VerifyNIN/);
    await expect(page.locator("h1")).toContainText("Login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should display registration page", async ({ page }) => {
    await page.goto("/register");

    await expect(page).toHaveTitle(/VerifyNIN/);
    await expect(page.locator("h1")).toContainText("Register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should show validation errors for invalid login", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator("text=Email is required")).toBeVisible();
    await expect(page.locator("text=Password is required")).toBeVisible();
  });

  test("should redirect to dashboard after successful login", async ({
    page,
  }) => {
    await page.goto("/login");

    // Fill in test credentials
    await page.fill('input[type="email"]', "test.user@example.com");
    await page.fill('input[type="password"]', "TestPassword123!");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("Admin Authentication", () => {
  test("should display admin login page", async ({ page }) => {
    await page.goto("/admin-login");

    await expect(page).toHaveTitle(/VerifyNIN/);
    await expect(page.locator("h1")).toContainText("Admin Login");
  });

  test("should redirect to admin dashboard after successful admin login", async ({
    page,
  }) => {
    await page.goto("/admin-login");

    // Fill in admin credentials
    await page.fill('input[type="email"]', "admin@verifynin.ng");
    await page.fill('input[type="password"]', "YourSecurePassword123!");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/);
  });
});
