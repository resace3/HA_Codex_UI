export type TerminalKind = "shell" | "codex";
export type TerminalStatus = "running" | "exited" | "stopped";

export type TerminalModel = {
  id: string;
  name: string;
  type: TerminalKind;
  workspaceId: string;
  cwd: string;
  createdAt: string;
  lastActiveAt: string;
  status: TerminalStatus;
  cols: number;
  rows: number;
};

export type CreateTerminalRequest = {
  type: TerminalKind;
  workspaceId: string;
  name?: string | undefined;
  command?: string | undefined;
  initialPrompt?: string | undefined;
};

export type TerminalResizeRequest = {
  cols: number;
  rows: number;
};

export type TerminalInputRequest = {
  data: string;
};

export type TerminalClientMessage =
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number }
  | { type: "ping" };

export type TerminalServerMessage =
  | { type: "output"; data: string }
  | { type: "status"; status: TerminalStatus }
  | { type: "exit"; code: number | null }
  | { type: "error"; message: string }
  | { type: "pong" };
