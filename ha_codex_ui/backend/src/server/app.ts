import fs from "node:fs";
import path from "node:path";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import type { AddonOptions } from "../config/addonOptions.js";
import { FRONTEND_DIST_DIR } from "../config/paths.js";
import { createLogger } from "../utils/log.js";
import { ArchiveService } from "../services/archiveService.js";
import { CodexService } from "../services/codexService.js";
import { DiagnosticsService } from "../services/diagnosticsService.js";
import { DiffService } from "../services/diffService.js";
import { FileService } from "../services/fileService.js";
import { HaService } from "../services/haService.js";
import { SettingsService } from "../services/settingsService.js";
import { TerminalService } from "../services/terminalService.js";
import { UploadService } from "../services/uploadService.js";
import { WorkspaceService } from "../services/workspaceService.js";
import { registerErrorHandler } from "./middleware/errorHandler.js";
import { registerIngressOnly } from "./middleware/ingressOnly.js";
import { registerIngressRewrite } from "./middleware/ingressRewrite.js";
import { registerRequestLogger } from "./middleware/requestLogger.js";
import { registerSecurityHeaders } from "./middleware/securityHeaders.js";
import { registerCodexRoutes } from "./routes/codexRoutes.js";
import { registerDiagnosticsRoutes } from "./routes/diagnosticsRoutes.js";
import { registerDiffRoutes } from "./routes/diffRoutes.js";
import { registerFileRoutes } from "./routes/fileRoutes.js";
import { registerHaRoutes } from "./routes/haRoutes.js";
import { registerHealthRoutes } from "./routes/healthRoutes.js";
import { registerSettingsRoutes } from "./routes/settingsRoutes.js";
import { registerTerminalRoutes } from "./routes/terminalRoutes.js";
import { registerWorkspaceRoutes } from "./routes/workspaceRoutes.js";

export type AppServices = {
  workspaceService: WorkspaceService;
  fileService: FileService;
  uploadService: UploadService;
  archiveService: ArchiveService;
  terminalService: TerminalService;
  codexService: CodexService;
  diagnosticsService: DiagnosticsService;
  diffService: DiffService;
  haService: HaService;
  settingsService: SettingsService;
};

export function createServices(options: AddonOptions): AppServices {
  const workspaceService = new WorkspaceService(options);
  const terminalService = new TerminalService(options);
  const codexService = new CodexService(options);
  return {
    workspaceService,
    fileService: new FileService(options),
    uploadService: new UploadService(options),
    archiveService: new ArchiveService(),
    terminalService,
    codexService,
    diagnosticsService: new DiagnosticsService(options, workspaceService, codexService, terminalService),
    diffService: new DiffService(options),
    haService: new HaService(),
    settingsService: new SettingsService(options),
  };
}

export async function buildApp(options: AddonOptions, services = createServices(options)) {
  const app = Fastify({
    loggerInstance: createLogger(options.log_level),
    bodyLimit: options.max_upload_mb * 1024 * 1024,
  });
  registerErrorHandler(app);
  registerIngressRewrite(app);
  registerSecurityHeaders(app);
  registerIngressOnly(app);
  registerRequestLogger(app);
  await app.register(multipart, {
    limits: {
      fileSize: options.max_upload_mb * 1024 * 1024,
      files: 16,
    },
  });
  if (fs.existsSync(FRONTEND_DIST_DIR)) {
    await app.register(staticPlugin, {
      root: FRONTEND_DIST_DIR,
      prefix: "/",
      wildcard: false,
    });
    app.setNotFoundHandler(async (_request, reply) => reply.sendFile("index.html"));
  }
  const startedAt = Date.now();
  registerHealthRoutes(app, startedAt);
  registerDiagnosticsRoutes(app, services.diagnosticsService);
  registerWorkspaceRoutes(app, services.workspaceService);
  registerFileRoutes(app, services.workspaceService, services.fileService, services.uploadService, services.archiveService);
  registerTerminalRoutes(app, services.workspaceService, services.terminalService);
  registerCodexRoutes(app, services.codexService, services.workspaceService, services.terminalService);
  registerDiffRoutes(app, services.workspaceService, services.diffService);
  registerSettingsRoutes(app, services.settingsService);
  registerHaRoutes(app, services.haService);
  app.get("/", async (_request, reply) => {
    const index = path.join(FRONTEND_DIST_DIR, "index.html");
    if (fs.existsSync(index)) {
      return reply.sendFile("index.html");
    }
    return { ok: true, data: { service: "ha-codex-ui", message: "Frontend assets are not built in this runtime." } };
  });
  return { app, services };
}
