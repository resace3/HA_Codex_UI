import fs from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ArchiveService } from "../../services/archiveService.js";
import type { FileService } from "../../services/fileService.js";
import type { UploadService } from "../../services/uploadService.js";
import type { WorkspaceService } from "../../services/workspaceService.js";
import { detectMime } from "../../security/safeMime.js";
import { ok, SafeError } from "../../types/api.js";
import { body, query } from "../middleware/validateJson.js";

const fileQuerySchema = z.object({
  workspaceId: z.string().min(1),
  path: z.string().default("."),
});

const writeSchema = z.object({
  workspaceId: z.string().min(1),
  path: z.string().min(1),
  contents: z.string(),
  confirmed: z.boolean().default(false),
});

const mkdirSchema = z.object({
  workspaceId: z.string().min(1),
  path: z.string().min(1),
  confirmed: z.boolean().default(false),
});

const renameSchema = z.object({
  workspaceId: z.string().min(1),
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
  confirmed: z.boolean().default(false),
});

const deleteSchema = z.object({
  workspaceId: z.string().min(1),
  path: z.string().min(1),
  confirmed: z.boolean().default(false),
});

export function registerFileRoutes(
  app: FastifyInstance,
  workspaceService: WorkspaceService,
  fileService: FileService,
  uploadService: UploadService,
  archiveService: ArchiveService,
): void {
  app.get("/api/files/tree", async (request) => {
    const input = query(request, fileQuerySchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    return ok(await fileService.tree(workspace, input.path ?? "."));
  });

  app.get("/api/files/read", async (request) => {
    const input = query(request, fileQuerySchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    return ok(await fileService.readText(workspace, input.path ?? "."));
  });

  app.put("/api/files/write", async (request) => {
    const input = body(request, writeSchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    return ok(await fileService.writeText(workspace, input.path, input.contents, input.confirmed));
  });

  app.post("/api/files/mkdir", async (request) => {
    const input = body(request, mkdirSchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    return ok(await fileService.mkdir(workspace, input.path, input.confirmed));
  });

  app.post("/api/files/rename", async (request) => {
    const input = body(request, renameSchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    return ok(await fileService.rename(workspace, input.fromPath, input.toPath, input.confirmed));
  });

  app.post("/api/files/delete", async (request) => {
    const input = body(request, deleteSchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    return ok(await fileService.delete(workspace, input.path, input.confirmed));
  });

  app.post("/api/files/upload", async (request) => {
    const workspaceId = String((request.query as Record<string, unknown>).workspaceId ?? "");
    const destination = String((request.query as Record<string, unknown>).path ?? ".");
    const overwrite = String((request.query as Record<string, unknown>).overwrite ?? "false") === "true";
    const confirmed = String((request.query as Record<string, unknown>).confirmed ?? "false") === "true";
    const workspace = await workspaceService.getWorkspace(workspaceId);
    const file = await request.file();
    if (!file) {
      throw new SafeError("NO_UPLOAD", "No upload file was provided.", 400);
    }
    return ok(await uploadService.upload(workspace, destination, file, overwrite, confirmed));
  });

  app.get("/api/files/download", async (request, reply) => {
    const input = query(request, fileQuerySchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    const resolved = fileService.resolveDownload(workspace, input.path ?? ".");
    const stat = await fs.promises.stat(resolved);
    if (!stat.isFile()) {
      throw new SafeError("NOT_A_FILE", "Only files can be downloaded from this endpoint.", 400);
    }
    reply.header("Content-Type", detectMime(resolved));
    reply.header("Content-Disposition", `attachment; filename="${path.basename(resolved)}"`);
    return reply.send(fs.createReadStream(resolved));
  });

  app.get("/api/files/download-zip", async (request, reply) => {
    const input = query(request, fileQuerySchema);
    const workspace = await workspaceService.getWorkspace(input.workspaceId);
    const resolved = fileService.resolveDownload(workspace, input.path ?? ".");
    await archiveService.streamZip(workspace, resolved, reply);
    return reply;
  });
}
