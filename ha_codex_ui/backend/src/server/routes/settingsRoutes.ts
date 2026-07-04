import type { FastifyInstance } from "fastify";
import type { SettingsService } from "../../services/settingsService.js";
import { ok } from "../../types/api.js";

export function registerSettingsRoutes(app: FastifyInstance, settingsService: SettingsService): void {
  app.get("/api/settings", async () => ok(settingsService.effectiveSettings()));
}
