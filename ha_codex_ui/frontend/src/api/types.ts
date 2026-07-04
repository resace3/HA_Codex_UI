export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type Workspace = {
  id: string;
  name: string;
  root: string;
  readable: boolean;
  writable: boolean;
  sensitive: boolean;
  reason?: string;
};

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

export type TerminalModel = {
  id: string;
  name: string;
  type: "shell" | "codex";
  workspaceId: string;
  cwd: string;
  createdAt: string;
  lastActiveAt: string;
  status: "running" | "exited" | "stopped";
  cols: number;
  rows: number;
};

export type CodexStatus = {
  installed: boolean;
  version: string | null;
  path: string | null;
  authState: "unknown" | "likely_authenticated" | "not_authenticated";
  codexHome: string;
};

export type DiagnosticCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail" | "unknown";
  message: string;
  details?: Record<string, unknown>;
};

export type DiagnosticsReport = {
  service: "ha-codex-ui";
  version: string;
  checks: DiagnosticCheck[];
  effectivePolicy: Record<string, unknown>;
  generatedAt: string;
};

export type DiffStatus = {
  source: "git" | "snapshot";
  files: Array<{ path: string; status: string }>;
};
