import { expect, test } from "@playwright/test";

test("app loads with Config Pilot branding", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Config Pilot" })).toBeVisible();
});

test("Ingress-like path prefix renders", async ({ page }) => {
  await page.goto("/api/hassio_ingress/test-token/");
  await expect(page.getByRole("heading", { name: "Config Pilot" })).toBeVisible();
});
