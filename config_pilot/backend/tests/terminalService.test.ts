import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultOptions } from "../src/config/addonOptions.js";
import { TerminalService } from "../src/services/terminalService.js";
import type { Workspace } from "../src/types/workspace.js";

describe("TerminalService", () => {
  let root: string;
  let service: TerminalService;
  let workspace: Workspace;

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "config-pilot-term-"));
    workspace = { id: "test", name: "Test", root, readable: true, writable: true, sensitive: false };
    service = new TerminalService({
      ...defaultOptions(),
      app_data_dir: path.join(root, ".data"),
      codex_home: path.join(root, ".data", ".codex"),
      max_terminal_sessions: 2,
      terminal_idle_timeout_minutes: 5,
    });
  });

  afterEach(async () => {
    await Promise.all(service.list().map((session) => service.delete(session.id)));
  });

  it("creates a shell PTY", async () => {
    const terminal = await service.create({ type: "shell", workspaceId: "test", command: "printf ready" }, workspace, true);
    expect(terminal.status).toBe("running");
  });

  it("resizes a PTY", async () => {
    const terminal = await service.create({ type: "shell", workspaceId: "test" }, workspace, true);
    const resized = service.resize(terminal.id, { cols: 100, rows: 24 });
    expect(resized.cols).toBe(100);
    expect(resized.rows).toBe(24);
  });

  it("enforces session limits", async () => {
    await service.create({ type: "shell", workspaceId: "test" }, workspace, true);
    await service.create({ type: "shell", workspaceId: "test" }, workspace, true);
    await expect(service.create({ type: "shell", workspaceId: "test" }, workspace, true)).rejects.toThrow(/maximum/);
  });

  it("marks persisted sessions exited after backend restart", async () => {
    const terminal = await service.create({ type: "shell", workspaceId: "test" }, workspace, true);
    await service.stop(terminal.id);
    const reloaded = new TerminalService({
      ...defaultOptions(),
      app_data_dir: path.join(root, ".data"),
      codex_home: path.join(root, ".data", ".codex"),
    });
    await reloaded.loadPersistedMetadata();
    expect(reloaded.list()[0]?.status).toBe("exited");
  });
});
