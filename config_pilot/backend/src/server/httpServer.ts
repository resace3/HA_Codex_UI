import { loadAddonOptions } from "../config/addonOptions.js";
import { loadEnv } from "../config/env.js";
import { ensureDir } from "../utils/fs.js";
import { buildApp } from "./app.js";
import { attachWebSocketServer } from "./websocket.js";

export async function startServer(): Promise<void> {
  const env = loadEnv();
  const options = loadAddonOptions();
  await ensureDir(options.app_data_dir);
  await ensureDir(options.codex_home, 0o700);
  await ensureDir(`${options.app_data_dir}/sessions`);
  await ensureDir(`${options.app_data_dir}/snapshots`);
  const { app, services } = await buildApp(options);
  await services.workspaceService.ensureDefaultWorkspaces();
  await services.terminalService.loadPersistedMetadata();
  attachWebSocketServer(app, services.terminalService);
  await app.listen({ host: "0.0.0.0", port: env.PORT });
}
