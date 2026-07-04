import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultOptions } from "../src/config/addonOptions.js";
import { WorkspaceService, workspaceIdForRoot } from "../src/services/workspaceService.js";

describe("WorkspaceService", () => {
  it("lists configured workspaces and marks sensitive roots", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "config-pilot-workspaces-"));
    const service = new WorkspaceService({
      ...defaultOptions(),
      default_workspace: root,
      upload_workspace: path.join(root, "uploads"),
      allowed_workspaces: [root, "/config"],
    });
    const workspaces = await service.listWorkspaces();
    expect(workspaces.some((workspace) => workspace.id === workspaceIdForRoot(root))).toBe(true);
    expect(workspaces.find((workspace) => workspace.root === "/config")?.sensitive).toBe(true);
  });

  it("creates only configured writable workspaces", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "config-pilot-create-"));
    const target = path.join(root, "workspace");
    const service = new WorkspaceService({
      ...defaultOptions(),
      default_workspace: target,
      upload_workspace: path.join(root, "uploads"),
      allowed_workspaces: [target],
    });
    const workspace = await service.createWorkspace(target);
    expect(workspace.writable).toBe(true);
  });
});
