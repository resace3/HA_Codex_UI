import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultOptions } from "../src/config/addonOptions.js";
import { DiffService } from "../src/services/diffService.js";
import type { Workspace } from "../src/types/workspace.js";

describe("DiffService", () => {
  it("uses snapshots for non-git workspaces", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-diff-"));
    await fs.promises.writeFile(path.join(root, "file.txt"), "hello", "utf8");
    const workspace: Workspace = { id: "test", name: "Test", root, readable: true, writable: true, sensitive: false };
    const service = new DiffService({ ...defaultOptions(), app_data_dir: path.join(root, ".data"), codex_home: path.join(root, ".data", ".codex") });
    expect((await service.status(workspace)).source).toBe("snapshot");
    expect((await service.snapshot(workspace)).id).toBeTruthy();
  });
});
