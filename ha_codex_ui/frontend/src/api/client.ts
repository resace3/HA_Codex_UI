import type {
  ApiResponse,
  CodexStatus,
  DiagnosticsReport,
  DiffStatus,
  FileReadResult,
  FileTreeEntry,
  TerminalModel,
  Workspace,
} from "./types";
import { apiPath } from "../utils/paths";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiPath(path), {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.ok) {
    throw new Error(payload.error.message);
  }
  return payload.data;
}

export const api = {
  health: () => request<{ service: string; version: string; uptimeSeconds: number; time: string }>("/api/health"),
  workspaces: () => request<Workspace[]>("/api/workspaces"),
  tree: (workspaceId: string, filePath = ".") => request<FileTreeEntry[]>(`/api/files/tree?workspaceId=${encodeURIComponent(workspaceId)}&path=${encodeURIComponent(filePath)}`),
  readFile: (workspaceId: string, filePath: string) => request<FileReadResult>(`/api/files/read?workspaceId=${encodeURIComponent(workspaceId)}&path=${encodeURIComponent(filePath)}`),
  writeFile: (workspaceId: string, filePath: string, contents: string, confirmed: boolean) =>
    request<{ path: string; bytes: number }>("/api/files/write", {
      method: "PUT",
      body: JSON.stringify({ workspaceId, path: filePath, contents, confirmed }),
    }),
  mkdir: (workspaceId: string, filePath: string, confirmed: boolean) =>
    request<{ path: string }>("/api/files/mkdir", {
      method: "POST",
      body: JSON.stringify({ workspaceId, path: filePath, confirmed }),
    }),
  delete: (workspaceId: string, filePath: string, confirmed: boolean) =>
    request<{ path: string }>("/api/files/delete", {
      method: "POST",
      body: JSON.stringify({ workspaceId, path: filePath, confirmed }),
    }),
  rename: (workspaceId: string, fromPath: string, toPath: string, confirmed: boolean) =>
    request<{ from: string; to: string }>("/api/files/rename", {
      method: "POST",
      body: JSON.stringify({ workspaceId, fromPath, toPath, confirmed }),
    }),
  upload: (workspaceId: string, filePath: string, file: File, overwrite: boolean, confirmed: boolean) => {
    const data = new FormData();
    data.set("file", file);
    return request<{ path: string; bytes: number }>(
      `/api/files/upload?workspaceId=${encodeURIComponent(workspaceId)}&path=${encodeURIComponent(filePath)}&overwrite=${String(overwrite)}&confirmed=${String(confirmed)}`,
      { method: "POST", body: data },
    );
  },
  terminals: () => request<TerminalModel[]>("/api/terminals"),
  createTerminal: (body: { type: "shell" | "codex"; workspaceId: string; name: string; initialPrompt?: string; confirmed?: boolean }) =>
    request<TerminalModel>("/api/terminals", { method: "POST", body: JSON.stringify(body) }),
  stopTerminal: (id: string) => request<TerminalModel>(`/api/terminals/${id}/stop`, { method: "POST" }),
  deleteTerminal: (id: string) => request<{ id: string }>(`/api/terminals/${id}`, { method: "DELETE" }),
  codexStatus: () => request<CodexStatus>("/api/codex/status"),
  codexAuth: () => request<{ authState: string; message: string }>("/api/codex/check-auth", { method: "POST" }),
  diagnostics: () => request<DiagnosticsReport>("/api/diagnostics"),
  diffStatus: (workspaceId: string) => request<DiffStatus>(`/api/diff/status?workspaceId=${encodeURIComponent(workspaceId)}`),
  diffFile: (workspaceId: string, filePath: string) => request<{ source: "git" | "snapshot"; diff: string }>(`/api/diff/file?workspaceId=${encodeURIComponent(workspaceId)}&path=${encodeURIComponent(filePath)}`),
  snapshot: (workspaceId: string) => request<{ id: string; createdAt: string }>("/api/diff/snapshot", { method: "POST", body: JSON.stringify({ workspaceId }) }),
  settings: () => request<Record<string, unknown>>("/api/settings"),
  haStatus: () => request<{ supervisorTokenPresent: boolean; coreReachable: boolean | null; message: string }>("/api/ha/status"),
  checkYaml: (fileName: string, contents: string) => request<{ valid: boolean; message: string }>("/api/ha/check-yaml", { method: "POST", body: JSON.stringify({ fileName, contents }) }),
};
