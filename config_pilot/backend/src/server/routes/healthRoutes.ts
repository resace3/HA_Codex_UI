import type { FastifyInstance } from "fastify";
import { ADDON_VERSION, SERVICE_NAME } from "../../config/paths.js";
import { ok } from "../../types/api.js";

export function registerHealthRoutes(app: FastifyInstance, startedAt: number): void {
  app.get("/api/health", async () =>
    ok({
      service: SERVICE_NAME,
      version: ADDON_VERSION,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      time: new Date().toISOString(),
    }),
  );
}
