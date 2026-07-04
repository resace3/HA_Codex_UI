import { expect, test, type Page } from "@playwright/test";

async function openMobileTerminalTab(page: Page) {
  const mobileTabs = page.getByRole("navigation", { name: "Primary" });
  if (await mobileTabs.isVisible()) {
    await page.getByRole("button", { name: "Terminal" }).click();
  }
}

test("starts a shell terminal and keeps input visible", async ({ page }) => {
  await page.goto("/");
  await openMobileTerminalTab(page);
  await page.getByTitle("New shell").click();
  await expect(page.locator(".terminal-view")).toBeVisible();
  await expect(page.getByTitle("Stop terminal")).toBeVisible();
});
