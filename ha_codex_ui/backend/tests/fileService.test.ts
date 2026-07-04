import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultOptions } from "../src/config/addonOptions.js";
import { FileService } from "../src/services/fileService.js";
import type { Workspace } from "../src/types/workspace.js";

describe("FileService", () => {
  let root: string;
  let workspace: Workspace;
  let service: FileService;

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-files-"));
    await fs.promises.mkdir(path.join(root, "folder"), { recursive: true });
    await fs.promises.writeFile(path.join(root, "folder", "hello.txt"), "hello", "utf8");
    await fs.promises.writeFile(path.join(root, "secrets.yaml.example"), "placeholder: true\n", "utf8");
    workspace = { id: "test", name: "Test", root, readable: true, writable: true, sensitive: false };
    service = new FileService({ ...defaultOptions(), app_data_dir: path.join(root, ".data"), codex_home: path.join(root, ".data", ".codex") });
  });

  it("lists normal files", async () => {
    const tree = await service.tree(workspace, ".");
    expect(tree.some((entry) => entry.name === "folder" && entry.type === "directory")).toBe(true);
  });

  it("reads text files", async () => {
    const result = await service.readText(workspace, "folder/hello.txt");
    expect(result.text).toBe("hello");
    expect(result.binary).toBe(false);
  });

  it("limits large text previews", async () => {
    await fs.promises.writeFile(path.join(root, "large.txt"), "a".repeat(1024 * 1024 + 50), "utf8");
    const result = await service.readText(workspace, "large.txt");
    expect(result.truncated).toBe(true);
  });

  it("blocks sensitive downloads", () => {
    expect(() => service.resolveDownload(workspace, "secrets.yaml")).toThrow(/blocked/);
  });

  it("writes text with a pre-write snapshot", async () => {
    const result = await service.writeText(workspace, "folder/hello.txt", "updated", true);
    expect(result.bytes).toBe(7);
    expect(await fs.promises.readFile(path.join(root, "folder", "hello.txt"), "utf8")).toBe("updated");
  });

  it("requires confirmation for delete", async () => {
    await expect(service.delete(workspace, "folder/hello.txt", false)).rejects.toThrow(/confirmation/);
  });

  it("fails clearly for read-only workspaces", async () => {
    await expect(service.writeText({ ...workspace, writable: false }, "x.txt", "x", true)).rejects.toThrow(/blocked/);
  });
});
