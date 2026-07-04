import { expect, test } from "@playwright/test";

test("starts a shell terminal and keeps input visible", async ({ page }) => {
  await page.goto("/");
  await page.getByTitle("New shell").click();
  await expect(page.locator(".terminal-view")).toBeVisible();
  await expect(page.getByTitle("Stop terminal")).toBeVisible();
});
