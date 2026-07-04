import fs from "node:fs";
import path from "node:path";
import type { AddonOptions } from "../config/addonOptions.js";
import { ADDON_VERSION, SERVICE_NAME } from "../config/paths.js";
import type { DiagnosticCheck, DiagnosticsReport } from "../types/diagnostics.js";
import { ensureDir, isWritable, pathExists } from "../utils/fs.js";
import { commandExists } from "../utils/process.js";
import type { CodexService } from "./codexService.js";
import type { TerminalService } from "./terminalService.js";
import type { WorkspaceService } from "./workspaceService.js";

export class DiagnosticsService {
  public constructor(
    private readonly options: AddonOptions,
    private readonly workspaceService: WorkspaceService,
    private readonly codexService: CodexService,
    private readonly terminalService: TerminalService,
  ) {}

  public async report(headers: Record<string, unknown> = {}): Promise<DiagnosticsReport> {
    const checks: DiagnosticCheck[] = [];
    checks.push(pass("backend", "Backend", "Backend process is running."));
    await this.checkPath(checks, "/data", "Data mount", true);
    await this.checkPath(checks, this.options.app_data_dir, "Persistent app data", true, true);
    await this.checkPath(checks, "/share", "Share mount", true);
    await this.checkPath(checks, "/config", "Home Assistant config mount", false);
    checks.push(await this.checkDefaultWorkspace());
    checks.push(await this.checkUploadWorkspace());
    for (const workspace of await this.workspaceService.listWorkspaces()) {
      checks.push({
        id: `workspace-${workspace.id}`,
        label: `Workspace ${workspace.name}`,
        status: workspace.readable ? "pass" : "warn",
        message: workspace.reason || (workspace.readable ? "Workspace is readable." : "Workspace is configured but not readable."),
        details: { root: workspace.root, writable: workspace.writable, sensitive: workspace.sensitive },
      });
    }
    const codex = await this.codexService.status();
    checks.push({
      id: "codex-installed",
      label: "Codex CLI",
      status: codex.installed ? "pass" : "warn",
      message: codex.installed ? "Codex CLI is installed." : "Codex CLI is not currently detectable.",
      details: { version: codex.version, path: codex.path, authState: codex.authState, codexHome: codex.codexHome },
    });
    checks.push(await commandCheck("git", "Git"));
    checks.push(await this.checkPty());
    checks.push(pass("websocket", "WebSocket support", "Terminal WebSocket bridge is enabled."));
    checks.push({
      id: "supervisor-token",
      label: "Supervisor token",
      status: process.env.SUPERVISOR_TOKEN ? "pass" : "warn",
      message: process.env.SUPERVISOR_TOKEN ? "Supervisor token is present and redacted." : "Supervisor token is not present.",
    });
    checks.push({
      id: "ingress-headers",
      label: "Ingress headers",
      status: hasIngressHeaders(headers) ? "pass" : "unknown",
      message: hasIngressHeaders(headers) ? "Home Assistant Ingress headers were detected." : "Ingress headers are not present on this request.",
    });
    checks.push(pass("node-version", "Node version", process.version));
    checks.push(pass("platform", "Platform", `${process.platform} ${process.arch}`));
    await this.checkPath(checks, path.join(this.options.app_data_dir, "snapshots"), "Snapshot directory", true, true);
    checks.push({
      id: "name-collision",
      label: "Name collision check",
      status: "unknown",
      message: "Name collision scanning is enforced in GitHub Actions.",
    });
    return {
      service: SERVICE_NAME,
      version: ADDON_VERSION,
      checks,
      effectivePolicy: {
        uploadSizeLimitBytes: this.options.max_upload_mb * 1024 * 1024,
        maxTerminalSessions: this.options.max_terminal_sessions,
        runningTerminalCount: this.terminalService.runningCount(),
        allowConfigWrite: this.options.allow_config_write,
        allowShell: this.options.allow_shell,
        allowCodex: this.options.allow_codex,
        codexHome: this.options.codex_home,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private async checkPath(checks: DiagnosticCheck[], target: string, label: string, requireWritable: boolean, create = false): Promise<void> {
    if (create) {
      await ensureDir(target).catch(() => undefined);
    }
    const exists = await pathExists(target);
    const writable = exists ? await isWritable(target) : false;
    checks.push({
      id: `path-${target.replace(/[^a-z0-9]+/gi, "-") || "root"}`,
      label,
      status: exists && (!requireWritable || writable) ? "pass" : "warn",
      message: exists ? (requireWritable && !writable ? "Path exists but is not writable." : "Path exists.") : "Path does not exist.",
      details: { path: target, writable },
    });
  }

  private async checkDefaultWorkspace(): Promise<DiagnosticCheck> {
    await ensureDir(this.options.default_workspace).catch(() => undefined);
    const exists = await pathExists(this.options.default_workspace);
    return {
      id: "default-workspace",
      label: "Default workspace",
      status: exists ? "pass" : "warn",
      message: exists ? "Default workspace exists or was created." : "Default workspace is missing and could not be created.",
      details: { path: this.options.default_workspace },
    };
  }

  private async checkUploadWorkspace(): Promise<DiagnosticCheck> {
    await ensureDir(this.options.upload_workspace).catch(() => undefined);
    const exists = await pathExists(this.options.upload_workspace);
    return {
      id: "upload-workspace",
      label: "Upload workspace",
      status: exists ? "pass" : "warn",
      message: exists ? "Upload workspace exists or was created." : "Upload workspace is missing and could not be created.",
      details: { path: this.options.upload_workspace },
    };
  }

  private async checkPty(): Promise<DiagnosticCheck> {
    try {
      const imported = await import("node-pty");
      return imported ? pass("node-pty", "PTY support", "node-pty module is available.") : warn("node-pty", "PTY support", "node-pty could not be loaded.");
    } catch {
      return warn("node-pty", "PTY support", "node-pty could not be loaded.");
    }
  }
}

async function commandCheck(command: string, label: string): Promise<DiagnosticCheck> {
  const commandPath = await commandExists(command);
  return {
    id: `command-${command}`,
    label,
    status: commandPath ? "pass" : "warn",
    message: commandPath ? `${label} is installed.` : `${label} is not detectable.`,
    ...(commandPath ? { details: { path: commandPath } } : {}),
  };
}

function hasIngressHeaders(headers: Record<string, unknown>): boolean {
  return Object.keys(headers).some((key) => key.toLowerCase().startsWith("x-ingress") || key.toLowerCase() === "x-ha-ingress-path");
}

function pass(id: string, label: string, message: string): DiagnosticCheck {
  return { id, label, status: "pass", message };
}

function warn(id: string, label: string, message: string): DiagnosticCheck {
  return { id, label, status: "warn", message };
}
