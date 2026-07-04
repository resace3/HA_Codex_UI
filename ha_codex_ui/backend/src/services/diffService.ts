import fs from "node:fs";
import path from "node:path";
import simpleGit from "simple-git";
import type { AddonOptions } from "../config/addonOptions.js";
import { SafeError } from "../types/api.js";
import type { Workspace } from "../types/workspace.js";
import { isSensitivePath, resolveWorkspacePath } from "../security/pathPolicy.js";
import { SnapshotService } from "./snapshotService.js";

export type DiffStatus = {
  source: "git" | "snapshot";
  files: Array<{ path: string; status: string }>;
};

export class DiffService {
  private readonly snapshotService: SnapshotService;

  public constructor(private readonly options: AddonOptions) {
    this.snapshotService = new SnapshotService(options);
  }

  public async status(workspace: Workspace): Promise<DiffStatus> {
    if (await this.isGitRepo(workspace.root)) {
      const git = simpleGit(workspace.root);
      const status = await git.status();
      return {
        source: "git",
        files: [...status.files].filter((file) => !isSensitivePath(path.join(workspace.root, file.path))).map((file) => ({ path: file.path, status: file.working_dir || file.index || "changed" })),
      };
    }
    return { source: "snapshot", files: [] };
  }

  public async fileDiff(workspace: Workspace, requestedPath: string): Promise<{ source: "git" | "snapshot"; diff: string }> {
    const resolved = resolveWorkspacePath(workspace.root, requestedPath);
    if (isSensitivePath(resolved)) {
      throw new SafeError("DIFF_BLOCKED", "Diffing this path is blocked by policy.", 403);
    }
    if (await this.isGitRepo(workspace.root)) {
      const git = simpleGit(workspace.root);
      const relative = path.relative(workspace.root, resolved);
      const diff = await git.diff(["--", relative]);
      return { source: "git", diff };
    }
    return { source: "snapshot", diff: "Snapshot diff is available after creating a snapshot." };
  }

  public async snapshot(workspace: Workspace): Promise<{ id: string; createdAt: string }> {
    const snapshot = await this.snapshotService.createSnapshot(workspace.root, "manual");
    return { id: snapshot.id, createdAt: snapshot.createdAt };
  }

  public async revertFile(workspace: Workspace, snapshotId: string, requestedPath: string): Promise<{ path: string }> {
    await this.snapshotService.revertFile(snapshotId, workspace.root, requestedPath);
    return { path: requestedPath };
  }

  public async revertAll(): Promise<never> {
    throw new SafeError("REVERT_ALL_UNSUPPORTED", "Bulk snapshot revert is not enabled. Revert files individually.", 400);
  }

  private async isGitRepo(root: string): Promise<boolean> {
    try {
      const stat = await fs.promises.stat(path.join(root, ".git"));
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
