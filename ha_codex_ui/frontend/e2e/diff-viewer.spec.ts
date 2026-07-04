import { expect, test } from "@playwright/test";

test("shows diff viewer and diagnostics", async ({ page }) => {
  await page.goto("/");
  const mobileTabs = page.getByRole("navigation", { name: "Primary" });
  if (await mobileTabs.isVisible()) {
    await page.getByRole("button", { name: "Inspector" }).click();
  }
  await expect(page.getByRole("heading", { name: "Diffs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Diagnostics" })).toBeVisible();
});
