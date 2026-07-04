import fs from "node:fs";
import path from "node:path";
import type { AddonOptions } from "../config/addonOptions.js";
import { DEFAULT_UPLOAD_WORKSPACE, DEFAULT_WORKSPACE } from "../config/paths.js";
import { isReadable, isWritable, ensureDir } from "../utils/fs.js";
import { SafeError } from "../types/api.js";
import type { Workspace } from "../types/workspace.js";

export class WorkspaceService {
  private currentWorkspaceId = "share-workspace";

  public constructor(private readonly options: AddonOptions) {}

  public async listWorkspaces(): Promise<Workspace[]> {
    const uniqueRoots = Array.from(new Set(this.options.allowed_workspaces.map((root) => path.resolve(root))));
    return Promise.all(uniqueRoots.map((root) => this.describeWorkspace(root)));
  }

  public async getWorkspace(id: string): Promise<Workspace> {
    const workspaces = await this.listWorkspaces();
    const workspace = workspaces.find((item) => item.id === id || item.root === id);
    if (!workspace) {
      throw new SafeError("WORKSPACE_NOT_FOUND", "The requested workspace is not configured.", 404);
    }
    return workspace;
  }

  public async createWorkspace(root: string, name?: string): Promise<Workspace> {
    const resolved = path.resolve(root);
    if (!this.options.allowed_workspaces.includes(resolved)) {
      throw new SafeError("WORKSPACE_NOT_ALLOWED", "Only configured workspace roots can be created.", 403);
    }
    const writable = this.isRootWritableByPolicy(resolved);
    if (!writable) {
      throw new SafeError("WORKSPACE_READ_ONLY", "This workspace is read-only by policy.", 403);
    }
    await ensureDir(resolved);
    const workspace = await this.describeWorkspace(resolved);
    return name ? { ...workspace, name } : workspace;
  }

  public async getCurrentWorkspace(): Promise<Workspace> {
    return this.getWorkspace(this.currentWorkspaceId);
  }

  public async setCurrentWorkspace(workspaceId: string): Promise<Workspace> {
    const workspace = await this.getWorkspace(workspaceId);
    this.currentWorkspaceId = workspace.id;
    return workspace;
  }

  public async ensureDefaultWorkspaces(): Promise<void> {
    for (const root of [this.options.default_workspace, this.options.upload_workspace]) {
      if (this.isRootWritableByPolicy(root)) {
        await ensureDir(root);
      }
    }
  }

  private async describeWorkspace(root: string): Promise<Workspace> {
    const id = workspaceIdForRoot(root);
    const exists = fs.existsSync(root);
    const readable = exists ? await isReadable(root) : false;
    const writable = exists ? await isWritable(root) && this.isRootWritableByPolicy(root) : this.isRootWritableByPolicy(root);
    const sensitive = isSensitiveWorkspaceRoot(root);
    const reason = this.reasonForRoot(root, exists, writable);
    return {
      id,
      name: workspaceName(root),
      root,
      readable,
      writable,
      sensitive,
      ...(reason ? { reason } : {}),
    };
  }

  private isRootWritableByPolicy(root: string): boolean {
    const normalized = path.resolve(root);
    if (normalized === path.resolve(DEFAULT_WORKSPACE) || normalized === path.resolve(DEFAULT_UPLOAD_WORKSPACE)) {
      return true;
    }
    if (normalized === "/config" || normalized.startsWith("/config/")) {
      return this.options.allow_config_write;
    }
    if (normalized === "/addons" || normalized.startsWith("/addons/")) {
      return this.options.allow_addons_write;
    }
    if (normalized === "/backup" || normalized.startsWith("/backup/")) {
      return this.options.allow_backup_write;
    }
    return normalized.startsWith("/share/");
  }

  private reasonForRoot(root: string, exists: boolean, writable: boolean): string | undefined {
    if (!exists) {
      return "Workspace is configured but does not exist yet.";
    }
    if (isSensitiveWorkspaceRoot(root) && !writable) {
      return "Sensitive Home Assistant folders are read-only by default.";
    }
    return undefined;
  }
}

export function workspaceIdForRoot(root: string): string {
  const normalized = path.resolve(root);
  if (normalized === path.resolve(DEFAULT_WORKSPACE)) {
    return "share-workspace";
  }
  if (normalized === path.resolve(DEFAULT_UPLOAD_WORKSPACE)) {
    return "uploads";
  }
  return normalized.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "root";
}

export function workspaceName(root: string): string {
  const normalized = path.resolve(root);
  if (normalized === path.resolve(DEFAULT_WORKSPACE)) {
    return "Workspace";
  }
  if (normalized === path.resolve(DEFAULT_UPLOAD_WORKSPACE)) {
    return "Uploads";
  }
  if (normalized === "/config") {
    return "Home Assistant config";
  }
  if (normalized === "/addons") {
    return "Add-ons";
  }
  if (normalized === "/backup") {
    return "Backups";
  }
  return path.basename(normalized) || normalized;
}

export function isSensitiveWorkspaceRoot(root: string): boolean {
  const normalized = path.resolve(root);
  return normalized === "/config" || normalized.startsWith("/config/") || normalized === "/addons" || normalized.startsWith("/addons/") || normalized === "/backup" || normalized.startsWith("/backup/");
}
