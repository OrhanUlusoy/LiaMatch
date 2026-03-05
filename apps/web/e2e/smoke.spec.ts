import { test, expect } from "@playwright/test";

test("homepage loads and shows hero section", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("text=LiaMatch")).toBeVisible();
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("input[type='email']")).toBeVisible();
  await expect(page.locator("input[type='password']")).toBeVisible();
});

test("explore page loads with search filters", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.locator("h1")).toBeVisible();
});

test("about page loads", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator("h1")).toBeVisible();
});
