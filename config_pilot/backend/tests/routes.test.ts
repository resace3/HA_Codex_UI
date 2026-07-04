import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultOptions } from "../src/config/addonOptions.js";
import { buildApp } from "../src/server/app.js";
import { workspaceIdForRoot } from "../src/services/workspaceService.js";

describe("routes", () => {
  it("serves health and file manager APIs", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "config-pilot-routes-"));
    await fs.promises.writeFile(path.join(root, "hello.txt"), "hello", "utf8");
    const { app } = await buildApp({
      ...defaultOptions(),
      app_data_dir: path.join(root, ".data"),
      codex_home: path.join(root, ".data", ".codex"),
      default_workspace: root,
      upload_workspace: path.join(root, "uploads"),
      allowed_workspaces: [root],
    });
    const health = await app.inject({ method: "GET", url: "/api/health" });
    expect(health.json().ok).toBe(true);
    const tree = await app.inject({ method: "GET", url: `/api/files/tree?workspaceId=${workspaceIdForRoot(root)}&path=.` });
    expect(tree.statusCode).toBe(200);
    await app.close();
  });
});
