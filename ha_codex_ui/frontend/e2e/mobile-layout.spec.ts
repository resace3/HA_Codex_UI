import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("phone viewport has tabs and no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.getByRole("button", { name: /Terminal/ }).click();
  await expect(page.getByTitle("New shell")).toBeVisible();
});
