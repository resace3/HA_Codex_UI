import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertDownloadAllowed,
  assertInsideWorkspace,
  assertReadAllowed,
  assertWriteAllowed,
  isDownloadAllowed,
  isReadAllowed,
  isSensitivePath,
  isUploadAllowed,
  isWriteAllowed,
  redactPathForLog,
  resolveWorkspacePath,
  sanitizeArchivePath,
} from "../src/security/pathPolicy.js";

describe("pathPolicy", () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-path-"));
    await fs.promises.mkdir(path.join(root, "sub"), { recursive: true });
    await fs.promises.writeFile(path.join(root, "sub", "normal.yaml"), "name: ok\n", "utf8");
  });

  it("blocks traversal outside the workspace", () => {
    expect(() => resolveWorkspacePath(root, "../outside.txt")).toThrow(/outside/);
  });

  it("blocks absolute path escape", () => {
    expect(() => resolveWorkspacePath(root, "/etc/passwd")).toThrow(/outside/);
  });

  it("blocks symlink escape", async () => {
    const outside = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-outside-"));
    await fs.promises.writeFile(path.join(outside, "secret.txt"), "hidden", "utf8");
    await fs.promises.symlink(outside, path.join(root, "escape"));
    const resolved = path.join(root, "escape", "secret.txt");
    expect(() => assertInsideWorkspace(root, resolved)).toThrow(/outside/);
  });

  it("blocks Codex auth storage", () => {
    expect(isSensitivePath("/data/ha_codex_ui/.codex/auth.json")).toBe(true);
    expect(isReadAllowed({ workspaceRoot: "/data/ha_codex_ui", resolvedPath: "/data/ha_codex_ui/.codex/auth.json" })).toBe(false);
  });

  it("blocks SSH and GnuPG paths", () => {
    expect(isSensitivePath(path.join(root, ".ssh", "id_ed25519"))).toBe(true);
    expect(isSensitivePath(path.join(root, ".gnupg", "private-keys-v1.d", "key"))).toBe(true);
  });

  it("blocks secrets.yaml by default", () => {
    expect(isSensitivePath(path.join(root, "secrets.yaml"))).toBe(true);
  });

  it("allows secrets.yaml.example", () => {
    expect(isSensitivePath(path.join(root, "secrets.yaml.example"))).toBe(false);
  });

  it("allows normal files in a workspace", () => {
    const resolved = resolveWorkspacePath(root, "sub/normal.yaml");
    expect(isReadAllowed({ workspaceRoot: root, resolvedPath: resolved })).toBe(true);
    expect(isDownloadAllowed({ workspaceRoot: root, resolvedPath: resolved })).toBe(true);
    expect(isUploadAllowed({ workspaceRoot: root, resolvedPath: resolved, workspaceWritable: true })).toBe(
      true,
    );
    expect(isWriteAllowed({ workspaceRoot: root, resolvedPath: resolved, workspaceWritable: true })).toBe(true);
    expect(() => assertReadAllowed({ workspaceRoot: root, resolvedPath: resolved })).not.toThrow();
    expect(() => assertDownloadAllowed({ workspaceRoot: root, resolvedPath: resolved })).not.toThrow();
    expect(() =>
      assertWriteAllowed({ workspaceRoot: root, resolvedPath: resolved, workspaceWritable: true }),
    ).not.toThrow();
  });

  it("blocks case-insensitive sensitive variants", () => {
    expect(isSensitivePath(path.join(root, "SeCrEtS.YaMl"))).toBe(true);
    expect(isSensitivePath(path.join(root, ".SSH", "config"))).toBe(true);
  });

  it("blocks token and browser credential paths", () => {
    expect(isSensitivePath(path.join(root, "refresh_token.txt"))).toBe(true);
    expect(isSensitivePath(path.join(root, "access_token.json"))).toBe(true);
    expect(isSensitivePath(path.join(root, "profile", "Cookies.sqlite"))).toBe(true);
    expect(isSensitivePath(path.join(root, ".config", "configstore", "auth.json"))).toBe(true);
    expect(isSensitivePath(path.join(root, "Library", "Application Support", "Chrome", "Login Data"))).toBe(true);
  });

  it("requires writable policy and sensitive confirmations", () => {
    const resolved = resolveWorkspacePath(root, "sub/normal.yaml");
    expect(isWriteAllowed({ workspaceRoot: root, resolvedPath: resolved, workspaceWritable: false })).toBe(false);
    expect(
      isWriteAllowed({
        workspaceRoot: root,
        resolvedPath: resolved,
        workspaceWritable: true,
        workspaceSensitive: true,
        allowSensitiveWrite: false,
        confirmed: true,
      }),
    ).toBe(false);
    expect(
      isWriteAllowed({
        workspaceRoot: root,
        resolvedPath: resolved,
        workspaceWritable: true,
        workspaceSensitive: true,
        allowSensitiveWrite: true,
        confirmed: false,
      }),
    ).toBe(false);
    expect(
      isWriteAllowed({
        workspaceRoot: root,
        resolvedPath: resolved,
        workspaceWritable: true,
        workspaceSensitive: true,
        allowSensitiveWrite: true,
        confirmed: true,
      }),
    ).toBe(true);
    expect(() =>
      assertWriteAllowed({ workspaceRoot: root, resolvedPath: resolved, workspaceWritable: false }),
    ).toThrow(/Writing/);
  });

  it("redacts sensitive paths for logs", () => {
    expect(redactPathForLog("/data/ha_codex_ui/.codex/auth.json")).toBe("[sensitive-path]");
    expect(redactPathForLog(path.join(root, "sub", "normal.yaml"))).toContain("normal.yaml");
  });

  it("prevents zip-slip archive paths", () => {
    expect(() => sanitizeArchivePath("../escape.txt")).toThrow(/Archive path/);
    expect(() => sanitizeArchivePath("safe/../../escape.txt")).toThrow(/Archive path/);
    expect(() => sanitizeArchivePath("")).toThrow(/Archive path/);
    expect(sanitizeArchivePath("/safe/file.txt")).toBe("safe/file.txt");
    expect(sanitizeArchivePath("safe/file.txt")).toBe("safe/file.txt");
  });
});
