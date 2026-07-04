import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { HaService } from "../../services/haService.js";
import { ok } from "../../types/api.js";
import { body } from "../middleware/validateJson.js";

const yamlCheckSchema = z.object({
  fileName: z.string().min(1),
  contents: z.string(),
});

export function registerHaRoutes(app: FastifyInstance, haService: HaService): void {
  app.get("/api/ha/status", async () => ok(await haService.status()));
  app.post("/api/ha/check-yaml", async (request) => {
    const input = body(request, yamlCheckSchema);
    return ok(await haService.checkYaml(input.fileName, input.contents));
  });
  app.post("/api/ha/check-config", async () => ok(await haService.checkConfig()));
}
