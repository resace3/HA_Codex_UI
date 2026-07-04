import { expect, test } from "@playwright/test";

test("starts fake Codex session in CI mode", async ({ page }) => {
  await page.goto("/");
  const start = page.getByTitle("Start Codex");
  await expect(start).toBeDisabled();
  await page.getByLabel("Codex can edit files and run commands.").check();
  await expect(start).toBeEnabled();
});
