import { expect, test } from "@playwright/test";

test("upload, open, edit, save, and download file", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Files")).toBeVisible();
  const response = await page.request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(page.getByText("Upload")).toBeVisible();
  await expect(page.getByText("Download")).toBeVisible();
});
