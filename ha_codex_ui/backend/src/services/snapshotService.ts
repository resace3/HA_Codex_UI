import fs from "node:fs";
import path from "node:path";
import type { AddonOptions } from "../config/addonOptions.js";
import { ensureDir, safeStat } from "../utils/fs.js";
import { isSensitivePath, sanitizeArchivePath } from "../security/pathPolicy.js";
import { isProbablyText } from "../security/safeMime.js";
import { SafeError } from "../types/api.js";

export type SnapshotInfo = {
  id: string;
  workspaceRoot: string;
  createdAt: string;
  root: string;
};

export class SnapshotService {
  public constructor(private readonly options: AddonOptions) {}

  public async createSnapshot(workspaceRoot: string, reason = "manual"): Promise<SnapshotInfo> {
    const id = `${Date.now()}-${reason.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
    const snapshotRoot = path.join(this.options.app_data_dir, "snapshots", id);
    await ensureDir(snapshotRoot);
    await copyWorkspace(workspaceRoot, snapshotRoot, workspaceRoot);
    await fs.promises.writeFile(
      path.join(snapshotRoot, ".ha-codex-ui-snapshot.json"),
      JSON.stringify({ id, workspaceRoot, createdAt: new Date().toISOString(), reason }, null, 2),
      "utf8",
    );
    return { id, workspaceRoot, createdAt: new Date().toISOString(), root: snapshotRoot };
  }

  public async revertFile(snapshotId: string, workspaceRoot: string, relativePath: string): Promise<void> {
    const archivePath = sanitizeArchivePath(relativePath);
    const source = path.join(this.options.app_data_dir, "snapshots", snapshotId, archivePath);
    const stat = await safeStat(source);
    if (!stat?.isFile()) {
      throw new SafeError("SNAPSHOT_FILE_NOT_FOUND", "Snapshot file was not found.", 404);
    }
    const destination = path.resolve(workspaceRoot, archivePath);
    await ensureDir(path.dirname(destination));
    await fs.promises.copyFile(source, destination);
  }
}

async function copyWorkspace(sourceRoot: string, targetRoot: string, baseRoot: string): Promise<void> {
  const entries = await fs.promises.readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const source = path.join(sourceRoot, entry.name);
    const relative = path.relative(baseRoot, source);
    if (entry.name === ".git" || entry.name === "node_modules" || isSensitivePath(source)) {
      continue;
    }
    const target = path.join(targetRoot, sanitizeArchivePath(relative));
    if (entry.isDirectory()) {
      await ensureDir(target);
      await copyWorkspace(source, targetRoot, baseRoot);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const stat = await fs.promises.stat(source);
    if (stat.size > 512 * 1024) {
      continue;
    }
    const sample = await fs.promises.readFile(source);
    if (!isProbablyText(source, sample)) {
      continue;
    }
    await ensureDir(path.dirname(target));
    await fs.promises.copyFile(source, target);
  }
}
