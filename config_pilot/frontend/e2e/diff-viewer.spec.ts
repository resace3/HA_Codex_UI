import { expect, test } from "@playwright/test";

test("shows diff viewer and diagnostics", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Diffs")).toBeVisible();
  await expect(page.getByText("Diagnostics")).toBeVisible();
});
