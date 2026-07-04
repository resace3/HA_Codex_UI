import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CodexService } from "../../services/codexService.js";
import type { TerminalService } from "../../services/terminalService.js";
import type { WorkspaceService } from "../../services/workspaceService.js";
import { ok } from "../../types/api.js";
import { body } from "../middleware/validateJson.js";

const codexSessionSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().default("Codex"),
  initialPrompt: z.string().optional(),
  confirmed: z.boolean().default(false),
});

export function registerCodexRoutes(app: FastifyInstance, codexService: CodexService, workspaceService: WorkspaceService, terminalService: TerminalService): void {
  app.get("/api/codex/status", async () => ok(await codexService.status()));
  app.post("/api/codex/check-auth", async () => ok(await codexService.checkAuth()));
  app.post("/api/codex/session", async (request) => {
    const input = body(request, codexSessionSchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    return ok(
      await terminalService.create(
        {
          type: "codex",
          workspaceId: input.workspaceId,
          name: input.name,
          ...(input.initialPrompt ? { initialPrompt: input.initialPrompt } : {}),
        },
        workspace,
        input.confirmed,
      ),
    );
  });
}
