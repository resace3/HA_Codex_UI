import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DiffService } from "../../services/diffService.js";
import type { WorkspaceService } from "../../services/workspaceService.js";
import { ok } from "../../types/api.js";
import { body, query } from "../middleware/validateJson.js";

const workspaceQuerySchema = z.object({ workspaceId: z.string().min(1) });
const fileQuerySchema = z.object({ workspaceId: z.string().min(1), path: z.string().min(1) });
const snapshotSchema = z.object({ workspaceId: z.string().min(1) });
const revertFileSchema = z.object({ workspaceId: z.string().min(1), snapshotId: z.string().min(1), path: z.string().min(1), confirmed: z.boolean().default(false) });

export function registerDiffRoutes(app: FastifyInstance, workspaceService: WorkspaceService, diffService: DiffService): void {
  app.get("/api/diff/status", async (request) => {
    const input = query(request, workspaceQuerySchema);
    return ok(await diffService.status(await workspaceService.getWorkspace(input.workspaceId)));
  });
  app.get("/api/diff/file", async (request) => {
    const input = query(request, fileQuerySchema);
    return ok(await diffService.fileDiff(await workspaceService.getWorkspace(input.workspaceId), input.path));
  });
  app.post("/api/diff/snapshot", async (request) => {
    const input = body(request, snapshotSchema);
    return ok(await diffService.snapshot(await workspaceService.getWorkspace(input.workspaceId)));
  });
  app.post("/api/diff/revert-file", async (request) => {
    const input = body(request, revertFileSchema);
    if (!input.confirmed) {
      return ok({ supported: false, message: "Reverting a file requires confirmation." });
    }
    return ok(await diffService.revertFile(await workspaceService.getWorkspace(input.workspaceId), input.snapshotId, input.path));
  });
  app.post("/api/diff/revert-all", async () => ok(await diffService.revertAll()));
}
