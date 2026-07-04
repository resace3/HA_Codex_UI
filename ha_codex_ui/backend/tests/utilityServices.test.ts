import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultOptions, loadAddonOptions, optionsSchemaJson } from "../src/config/addonOptions.js";
import { isTruthy, loadEnv } from "../src/config/env.js";
import { assertTerminalAllowed, shellCommandFor } from "../src/security/commandPolicy.js";
import { MemoryRateLimit } from "../src/security/rateLimit.js";
import { HaService } from "../src/services/haService.js";
import { SettingsService } from "../src/services/settingsService.js";
import { sleep, withTimeout } from "../src/utils/async.js";
import {
  displayNameForPath,
  ensureDir,
  isReadable,
  isWritable,
  pathExists,
  safeStat,
} from "../src/utils/fs.js";
import { commandExists, safeExecFile } from "../src/utils/process.js";
import type { Workspace } from "../src/types/workspace.js";

describe("utility and small service coverage", () => {
  it("covers filesystem helpers", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-utils-"));
    const nested = path.join(root, "nested");
    await ensureDir(nested, 0o755);
    expect(await pathExists(nested)).toBe(true);
    expect(await isReadable(nested)).toBe(true);
    expect(await isWritable(nested)).toBe(true);
    expect(displayNameForPath(nested)).toBe("nested");
    expect(displayNameForPath("/")).toBe("/");
    expect(await safeStat(nested)).not.toBeNull();
    expect(await safeStat(path.join(root, "missing"))).toBeNull();
  });

  it("covers async timeout helpers", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 50, "too slow")).resolves.toBe("ok");
    await expect(withTimeout(sleep(50), 1, "too slow")).rejects.toThrow(/too slow/);
  });

  it("covers process helpers", async () => {
    expect(await commandExists("sh")).toBeTruthy();
    expect(await commandExists("ha-codex-ui-definitely-missing")).toBeNull();
    await expect(safeExecFile(process.execPath, ["-e", "console.log('ok')"])).resolves.toMatchObject({
      stdout: "ok\n",
      code: 0,
    });
    await expect(safeExecFile(process.execPath, ["-e", "process.exit(7)"])).resolves.toMatchObject({ code: 7 });
  });

  it("covers rate limiting", () => {
    const limit = new MemoryRateLimit(2, 1000);
    limit.assertAllowed("client");
    limit.assertAllowed("client");
    expect(() => limit.assertAllowed("client")).toThrow(/Too many requests/);
  });

  it("covers option and env parsing", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-options-"));
    const optionsPath = path.join(root, "options.json");
    await fs.promises.writeFile(
      optionsPath,
      JSON.stringify({
        default_workspace: "./workspace",
        upload_workspace: "./uploads",
        allowed_workspaces: ["./workspace", "/config"],
        codex_home: "./data/.codex",
        app_data_dir: "./data",
      }),
      "utf8",
    );
    expect(loadAddonOptions(optionsPath)).toMatchObject({
      default_workspace: path.resolve("./workspace"),
      upload_workspace: path.resolve("./uploads"),
      allowed_workspaces: [path.resolve("./workspace"), "/config"],
      codex_home: path.resolve("./data/.codex"),
      app_data_dir: path.resolve("./data"),
    });
    expect(optionsSchemaJson()).toBeTruthy();
    expect(loadEnv({ NODE_ENV: "test", PORT: "8123" })).toMatchObject({
      NODE_ENV: "test",
      PORT: 8123,
    });
    expect(isTruthy("1")).toBe(true);
    expect(isTruthy("true")).toBe(true);
    expect(isTruthy("0")).toBe(false);
  });

  it("covers terminal command policy", () => {
    const options = defaultOptions();
    const workspace: Workspace = {
      id: "workspace",
      name: "Workspace",
      root: "/share/ha_codex_ui_workspace",
      readable: true,
      writable: true,
      sensitive: false,
    };
    expect(() => assertTerminalAllowed(options, "shell", workspace)).not.toThrow();
    expect(() => assertTerminalAllowed({ ...options, allow_shell: false }, "shell", workspace)).toThrow(
      /disabled/,
    );
    expect(() => assertTerminalAllowed({ ...options, allow_codex: false }, "codex", workspace)).toThrow(
      /disabled/,
    );
    expect(() => assertTerminalAllowed(options, "codex", { ...workspace, sensitive: true })).toThrow(
      /confirmation/,
    );
    expect(shellCommandFor("codex")).toEqual({ command: "codex", args: [] });
    expect(shellCommandFor("shell", "echo ok")).toEqual({ command: "/bin/bash", args: ["-lc", "echo ok"] });
    expect(shellCommandFor("shell")).toEqual({ command: "/bin/bash", args: ["-l"] });
  });

  it("covers settings and Home Assistant status helpers", async () => {
    const options = defaultOptions();
    expect(new SettingsService(options).effectiveSettings()).toMatchObject({
      default_workspace: "/share/ha_codex_ui_workspace",
      allow_config_write: false,
      security_note: expect.stringContaining("read-only"),
    });
    const previousToken = process.env.SUPERVISOR_TOKEN;
    delete process.env.SUPERVISOR_TOKEN;
    await expect(new HaService().status()).resolves.toMatchObject({
      supervisorTokenPresent: false,
      coreReachable: null,
    });
    await expect(new HaService().checkYaml("ok.yaml", "name: ok\n")).resolves.toMatchObject({ valid: true });
    await expect(new HaService().checkYaml("bad.yaml", "name: [")).resolves.toMatchObject({ valid: false });
    await expect(new HaService().checkConfig()).resolves.toMatchObject({ supported: false, valid: null });
    if (previousToken !== undefined) {
      process.env.SUPERVISOR_TOKEN = previousToken;
    }
  });
});
