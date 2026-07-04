import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { TerminalService } from "../../services/terminalService.js";
import type { WorkspaceService } from "../../services/workspaceService.js";
import { ok } from "../../types/api.js";
import { body } from "../middleware/validateJson.js";

const createTerminalSchema = z.object({
  type: z.enum(["shell", "codex"]),
  workspaceId: z.string().min(1),
  name: z.string().optional(),
  command: z.string().optional(),
  initialPrompt: z.string().optional(),
  confirmed: z.boolean().default(false),
});

const resizeSchema = z.object({
  cols: z.number().int().min(20).max(300),
  rows: z.number().int().min(5).max(100),
});

const inputSchema = z.object({
  data: z.string(),
});

export function registerTerminalRoutes(app: FastifyInstance, workspaceService: WorkspaceService, terminalService: TerminalService): void {
  app.post("/api/terminals", async (request) => {
    const input = body(request, createTerminalSchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    return ok(await terminalService.create(input, workspace, input.confirmed));
  });
  app.get("/api/terminals", async () => ok(terminalService.list()));
  app.get("/api/terminals/:id", async (request) => ok(terminalService.get((request.params as { id: string }).id)));
  app.post("/api/terminals/:id/resize", async (request) => {
    const input = body(request, resizeSchema);
    return ok(terminalService.resize((request.params as { id: string }).id, input));
  });
  app.post("/api/terminals/:id/input", async (request) => {
    const input = body(request, inputSchema);
    return ok(terminalService.input((request.params as { id: string }).id, input));
  });
  app.post("/api/terminals/:id/stop", async (request) => ok(await terminalService.stop((request.params as { id: string }).id)));
  app.delete("/api/terminals/:id", async (request) => ok(await terminalService.delete((request.params as { id: string }).id)));
  app.get("/api/terminals/:id/ws", async () => ok({ message: "Use WebSocket upgrade for this endpoint." }));
}
