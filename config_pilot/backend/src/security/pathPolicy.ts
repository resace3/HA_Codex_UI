import fs from "node:fs";
import path from "node:path";
import { SafeError } from "../types/api.js";

const SENSITIVE_FILE_NAMES = new Set([
  "auth.json",
  "credentials.json",
  "tokens.json",
  "token.json",
  "cookies",
  "cookies.sqlite",
  "login data",
  "key4.db",
]);

const SENSITIVE_DIR_NAMES = new Set([".ssh", ".gnupg", ".codex", "browser profiles", "chrome", "chromium", "firefox"]);

export type PathPolicyInput = {
  workspaceRoot: string;
  resolvedPath: string;
  workspaceWritable?: boolean;
  workspaceSensitive?: boolean;
  allowSensitiveWrite?: boolean;
  confirmed?: boolean;
};

export function resolveWorkspacePath(workspaceRoot: string, requestedPath = "."): string {
  const root = path.resolve(workspaceRoot);
  const requested = requestedPath.trim() === "" ? "." : requestedPath;
  const candidate = path.isAbsolute(requested) ? path.resolve(requested) : path.resolve(root, requested);
  assertInsideWorkspace(root, candidate);
  return candidate;
}

export function assertInsideWorkspace(workspaceRoot: string, resolvedPath: string): void {
  const root = realPathForPolicy(path.resolve(workspaceRoot));
  const target = realPathForPolicy(path.resolve(resolvedPath));
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }
  throw new SafeError("PATH_OUTSIDE_WORKSPACE", "The requested path is outside the selected workspace.", 403);
}

export function isSensitivePath(resolvedPath: string): boolean {
  const normalized = path.resolve(resolvedPath);
  const lower = normalized.toLowerCase();
  const parts = lower.split(path.sep).filter(Boolean);
  if (lower === "/data/config_pilot/.codex" || lower.startsWith("/data/config_pilot/.codex/")) {
    return true;
  }
  for (const part of parts) {
    if (SENSITIVE_DIR_NAMES.has(part)) {
      return true;
    }
  }
  const base = path.basename(lower);
  if (base === "secrets.yaml") {
    return true;
  }
  if (base === "secrets.yaml.example") {
    return false;
  }
  if (SENSITIVE_FILE_NAMES.has(base)) {
    return true;
  }
  if (base.includes("refresh_token") || base.includes("access_token") || base.includes("id_token")) {
    return true;
  }
  if (lower.includes("/.config/configstore/") || lower.includes("/library/application support/")) {
    return true;
  }
  return false;
}

export function isReadAllowed(input: PathPolicyInput): boolean {
  try {
    assertInsideWorkspace(input.workspaceRoot, input.resolvedPath);
  } catch {
    return false;
  }
  return !isSensitivePath(input.resolvedPath);
}

export function isWriteAllowed(input: PathPolicyInput): boolean {
  if (!isReadAllowed(input)) {
    return false;
  }
  if (!input.workspaceWritable) {
    return false;
  }
  if (input.workspaceSensitive && !input.allowSensitiveWrite) {
    return false;
  }
  if (input.workspaceSensitive && !input.confirmed) {
    return false;
  }
  return true;
}

export function isDownloadAllowed(input: PathPolicyInput): boolean {
  return isReadAllowed(input);
}

export function isUploadAllowed(input: PathPolicyInput): boolean {
  return isWriteAllowed(input);
}

export function assertReadAllowed(input: PathPolicyInput): void {
  if (!isReadAllowed(input)) {
    throw new SafeError("READ_BLOCKED", "Reading this path is blocked by the Config Pilot safety policy.", 403);
  }
}

export function assertWriteAllowed(input: PathPolicyInput): void {
  if (!isWriteAllowed(input)) {
    throw new SafeError("WRITE_BLOCKED", "Writing this path is blocked by the Config Pilot safety policy.", 403);
  }
}

export function assertDownloadAllowed(input: PathPolicyInput): void {
  if (!isDownloadAllowed(input)) {
    throw new SafeError("DOWNLOAD_BLOCKED", "Downloading this path is blocked by the Config Pilot safety policy.", 403);
  }
}

export function sanitizeArchivePath(inputPath: string): string {
  const unix = inputPath.replace(/\\/g, "/").replace(/^[A-Za-z]:/, "");
  const normalized = path.posix.normalize(unix).replace(/^\/+/, "");
  if (normalized === "." || normalized === "" || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new SafeError("UNSAFE_ARCHIVE_PATH", "Archive path is unsafe.", 400);
  }
  return normalized;
}

export function redactPathForLog(inputPath: string): string {
  const normalized = path.resolve(inputPath);
  if (isSensitivePath(normalized)) {
    return "[sensitive-path]";
  }
  if (normalized.startsWith("/data/config_pilot")) {
    return normalized.replace("/data/config_pilot", "/data/config_pilot");
  }
  return normalized;
}

function realPathForPolicy(target: string): string {
  try {
    return fs.realpathSync.native(target);
  } catch {
    const parent = path.dirname(target);
    try {
      return path.join(fs.realpathSync.native(parent), path.basename(target));
    } catch {
      return target;
    }
  }
}
