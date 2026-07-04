import { expect, test } from "@playwright/test";

test("app loads with HA_Codex_UI branding", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "HA_Codex_UI" })).toBeVisible();
});

test("Ingress-like path prefix renders", async ({ page }) => {
  await page.goto("/api/hassio_ingress/test-token/");
  await expect(page.getByRole("heading", { name: "HA_Codex_UI" })).toBeVisible();
});
