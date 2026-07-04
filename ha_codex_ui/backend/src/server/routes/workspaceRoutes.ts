import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { WorkspaceService } from "../../services/workspaceService.js";
import { ok } from "../../types/api.js";
import { body } from "../middleware/validateJson.js";

const workspaceCreateSchema = z.object({
  root: z.string().min(1),
  name: z.string().optional(),
});

const workspaceSelectionSchema = z.object({
  workspaceId: z.string().min(1),
});

export function registerWorkspaceRoutes(app: FastifyInstance, workspaceService: WorkspaceService): void {
  app.get("/api/workspaces", async () => ok(await workspaceService.listWorkspaces()));
  app.post("/api/workspaces", async (request) => {
    const input = body(request, workspaceCreateSchema);
    return ok(await workspaceService.createWorkspace(input.root, input.name));
  });
  app.get("/api/workspaces/current", async () => ok(await workspaceService.getCurrentWorkspace()));
  app.post("/api/workspaces/current", async (request) => {
    const input = body(request, workspaceSelectionSchema);
    return ok(await workspaceService.setCurrentWorkspace(input.workspaceId));
  });
}
