import fs from "node:fs";
import path from "node:path";
import type { AddonOptions } from "../config/addonOptions.js";
import {
  assertDownloadAllowed,
  assertReadAllowed,
  assertWriteAllowed,
  resolveWorkspacePath,
} from "../security/pathPolicy.js";
import { detectMime, isProbablyText } from "../security/safeMime.js";
import { SafeError } from "../types/api.js";
import type { Workspace } from "../types/workspace.js";
import { ensureDir, safeStat } from "../utils/fs.js";
import { SnapshotService } from "./snapshotService.js";

export type FileTreeEntry = {
  name: string;
  path: string;
  type: "file" | "directory" | "symlink" | "other";
  size: number;
  modifiedAt: string;
  writable: boolean;
  sensitive: boolean;
};

export type FileReadResult = {
  path: string;
  name: string;
  mime: string;
  size: number;
  text: string | null;
  truncated: boolean;
  binary: boolean;
  writable: boolean;
};

export class FileService {
  private readonly previewLimitBytes = 1024 * 1024;
  private readonly snapshotService: SnapshotService;

  public constructor(private readonly options: AddonOptions) {
    this.snapshotService = new SnapshotService(options);
  }

  public async tree(workspace: Workspace, requestedPath = "."): Promise<FileTreeEntry[]> {
    const root = this.resolveAndAssertRead(workspace, requestedPath);
    const stat = await safeStat(root);
    if (!stat?.isDirectory()) {
      throw new SafeError("NOT_A_DIRECTORY", "The requested path is not a directory.", 400);
    }
    const entries = await fs.promises.readdir(root, { withFileTypes: true });
    const tree = await Promise.all(
      entries.map(async (entry) => {
        const resolved = path.join(root, entry.name);
        const entryStat = await fs.promises.lstat(resolved);
        const relative = path.relative(workspace.root, resolved) || ".";
        const type = entry.isDirectory() ? "directory" : entry.isFile() ? "file" : entry.isSymbolicLink() ? "symlink" : "other";
        const sensitive = !this.canRead(workspace, resolved);
        return {
          name: entry.name,
          path: relative,
          type,
          size: entryStat.size,
          modifiedAt: entryStat.mtime.toISOString(),
          writable: !sensitive && workspace.writable,
          sensitive,
        };
      }),
    );
    return tree.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "directory" ? -1 : 1));
  }

  public async readText(workspace: Workspace, requestedPath: string): Promise<FileReadResult> {
    const resolved = this.resolveAndAssertRead(workspace, requestedPath);
    const stat = await safeStat(resolved);
    if (!stat?.isFile()) {
      throw new SafeError("NOT_A_FILE", "The requested path is not a file.", 400);
    }
    const size = stat.size;
    const handle = await fs.promises.open(resolved, "r");
    try {
      const buffer = Buffer.alloc(Math.min(size, this.previewLimitBytes));
      await handle.read(buffer, 0, buffer.length, 0);
      const binary = !isProbablyText(resolved, buffer);
      return {
        path: path.relative(workspace.root, resolved),
        name: path.basename(resolved),
        mime: detectMime(resolved),
        size,
        text: binary ? null : buffer.toString("utf8"),
        truncated: size > this.previewLimitBytes,
        binary,
        writable: workspace.writable,
      };
    } finally {
      await handle.close();
    }
  }

  public async writeText(workspace: Workspace, requestedPath: string, contents: string, confirmed = false): Promise<{ path: string; bytes: number }> {
    const resolved = resolveWorkspacePath(workspace.root, requestedPath);
    assertWriteAllowed({
      workspaceRoot: workspace.root,
      resolvedPath: resolved,
      workspaceWritable: workspace.writable,
      workspaceSensitive: workspace.sensitive,
      allowSensitiveWrite: this.allowSensitiveWrite(workspace),
      confirmed,
    });
    if (this.options.create_snapshot_before_write) {
      await this.snapshotService.createSnapshot(workspace.root, "before-write");
    }
    await ensureDir(path.dirname(resolved));
    await fs.promises.writeFile(resolved, contents, { encoding: "utf8", mode: 0o644 });
    return { path: path.relative(workspace.root, resolved), bytes: Buffer.byteLength(contents, "utf8") };
  }

  public async mkdir(workspace: Workspace, requestedPath: string, confirmed = false): Promise<{ path: string }> {
    const resolved = resolveWorkspacePath(workspace.root, requestedPath);
    assertWriteAllowed({
      workspaceRoot: workspace.root,
      resolvedPath: resolved,
      workspaceWritable: workspace.writable,
      workspaceSensitive: workspace.sensitive,
      allowSensitiveWrite: this.allowSensitiveWrite(workspace),
      confirmed,
    });
    await ensureDir(resolved);
    return { path: path.relative(workspace.root, resolved) };
  }

  public async rename(workspace: Workspace, fromPath: string, toPath: string, confirmed = false): Promise<{ from: string; to: string }> {
    const from = resolveWorkspacePath(workspace.root, fromPath);
    const to = resolveWorkspacePath(workspace.root, toPath);
    for (const resolvedPath of [from, to]) {
      assertWriteAllowed({
        workspaceRoot: workspace.root,
        resolvedPath,
        workspaceWritable: workspace.writable,
        workspaceSensitive: workspace.sensitive,
        allowSensitiveWrite: this.allowSensitiveWrite(workspace),
        confirmed,
      });
    }
    await ensureDir(path.dirname(to));
    await fs.promises.rename(from, to);
    return { from: path.relative(workspace.root, from), to: path.relative(workspace.root, to) };
  }

  public async delete(workspace: Workspace, requestedPath: string, confirmed = false): Promise<{ path: string }> {
    if (!confirmed) {
      throw new SafeError("CONFIRMATION_REQUIRED", "Deleting files requires confirmation.", 409);
    }
    const resolved = resolveWorkspacePath(workspace.root, requestedPath);
    assertWriteAllowed({
      workspaceRoot: workspace.root,
      resolvedPath: resolved,
      workspaceWritable: workspace.writable,
      workspaceSensitive: workspace.sensitive,
      allowSensitiveWrite: this.allowSensitiveWrite(workspace),
      confirmed,
    });
    await fs.promises.rm(resolved, { recursive: true, force: false });
    return { path: path.relative(workspace.root, resolved) };
  }

  public resolveDownload(workspace: Workspace, requestedPath: string): string {
    const resolved = resolveWorkspacePath(workspace.root, requestedPath);
    assertDownloadAllowed({ workspaceRoot: workspace.root, resolvedPath: resolved });
    return resolved;
  }

  private resolveAndAssertRead(workspace: Workspace, requestedPath: string): string {
    const resolved = resolveWorkspacePath(workspace.root, requestedPath);
    assertReadAllowed({ workspaceRoot: workspace.root, resolvedPath: resolved });
    return resolved;
  }

  private canRead(workspace: Workspace, resolvedPath: string): boolean {
    try {
      assertReadAllowed({ workspaceRoot: workspace.root, resolvedPath });
      return true;
    } catch {
      return false;
    }
  }

  private allowSensitiveWrite(workspace: Workspace): boolean {
    if (workspace.root === "/config") {
      return this.options.allow_config_write;
    }
    if (workspace.root === "/addons") {
      return this.options.allow_addons_write;
    }
    if (workspace.root === "/backup") {
      return this.options.allow_backup_write;
    }
    return !workspace.sensitive;
  }
}
