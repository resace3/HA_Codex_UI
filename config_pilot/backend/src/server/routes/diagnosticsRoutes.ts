import type { FastifyInstance } from "fastify";
import { ok } from "../../types/api.js";
import type { DiagnosticsService } from "../../services/diagnosticsService.js";

export function registerDiagnosticsRoutes(app: FastifyInstance, diagnosticsService: DiagnosticsService): void {
  app.get("/api/diagnostics", async (request) => ok(await diagnosticsService.report(request.headers)));
}
