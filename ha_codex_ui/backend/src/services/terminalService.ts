import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type WebSocket from "ws";
import type { AddonOptions } from "../config/addonOptions.js";
import { DEFAULT_CODEX_HOME } from "../config/paths.js";
import { assertTerminalAllowed, shellCommandFor } from "../security/commandPolicy.js";
import { SafeError } from "../types/api.js";
import type {
  CreateTerminalRequest,
  TerminalClientMessage,
  TerminalInputRequest,
  TerminalModel,
  TerminalResizeRequest,
  TerminalServerMessage,
} from "../types/terminal.js";
import type { Workspace } from "../types/workspace.js";
import { ensureDir } from "../utils/fs.js";

type TerminalMessageBus = {
  onData: (listener: (data: string) => void) => void;
  onExit: (listener: (payload: { exitCode: number }) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: () => void;
};

type NodePtyModule = typeof import("node-pty");

type Session = {
  model: TerminalModel;
  ptyProcess: TerminalMessageBus | null;
  clients: Set<WebSocket>;
  idleTimer?: NodeJS.Timeout;
};

let nodePty: NodePtyModule | null = null;

export class TerminalService {
  private readonly sessions = new Map<string, Session>();

  public constructor(private readonly options: AddonOptions) {}

  public async loadPersistedMetadata(): Promise<void> {
    const sessionsDir = path.join(this.options.app_data_dir, "sessions");
    await ensureDir(sessionsDir);
    const entries = await fs.promises.readdir(sessionsDir).catch(() => []);
    for (const entry of entries) {
      if (!entry.endsWith(".json")) {
        continue;
      }
      const fullPath = path.join(sessionsDir, entry);
      try {
        const model = JSON.parse(await fs.promises.readFile(fullPath, "utf8")) as TerminalModel;
        this.sessions.set(model.id, {
          model: { ...model, status: "exited" },
          ptyProcess: null,
          clients: new Set(),
        });
      } catch {
        // Corrupt metadata is ignored and can be removed by deleting the session.
      }
    }
  }

  public list(): TerminalModel[] {
    return Array.from(this.sessions.values()).map((session) => session.model);
  }

  public get(id: string): TerminalModel {
    return this.requireSession(id).model;
  }

  public async create(request: CreateTerminalRequest, workspace: Workspace, confirmed = false): Promise<TerminalModel> {
    assertTerminalAllowed(this.options, request.type, workspace, confirmed);
    const runningCount = this.list().filter((session) => session.status === "running").length;
    if (runningCount >= this.options.max_terminal_sessions) {
      throw new SafeError("TERMINAL_LIMIT_REACHED", "The maximum number of terminal sessions is already running.", 429);
    }
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const name = request.name || (request.type === "codex" ? "Codex" : "Shell");
    const model: TerminalModel = {
      id,
      name,
      type: request.type,
      workspaceId: workspace.id,
      cwd: workspace.root,
      createdAt,
      lastActiveAt: createdAt,
      status: "running",
      cols: 120,
      rows: 30,
    };
    const pty = await this.getNodePty();
    const command = this.commandFor(request);
    const ptyProcess = pty.spawn(command.command, command.args, {
      name: "xterm-256color",
      cwd: workspace.root,
      cols: model.cols,
      rows: model.rows,
      env: {
        ...process.env,
        HOME: this.options.app_data_dir,
        CODEX_HOME: this.options.codex_home || DEFAULT_CODEX_HOME,
        HA_CODEX_UI_WORKSPACE: workspace.root,
      },
    });
    const session: Session = { model, ptyProcess, clients: new Set() };
    this.sessions.set(id, session);
    ptyProcess.onData((data) => {
      session.model.lastActiveAt = new Date().toISOString();
      this.broadcast(session, { type: "output", data });
      this.scheduleIdleCleanup(session);
    });
    ptyProcess.onExit(({ exitCode }) => {
      session.model.status = "exited";
      session.ptyProcess = null;
      this.broadcast(session, { type: "exit", code: exitCode });
      void this.persist(model);
    });
    if (request.type === "codex" && request.initialPrompt?.trim()) {
      ptyProcess.write(`${request.initialPrompt.trim()}\r`);
    }
    this.scheduleIdleCleanup(session);
    await this.persist(model);
    return model;
  }

  public resize(id: string, request: TerminalResizeRequest): TerminalModel {
    const session = this.requireRunningSession(id);
    const cols = Math.max(20, Math.min(300, request.cols));
    const rows = Math.max(5, Math.min(100, request.rows));
    session.ptyProcess?.resize(cols, rows);
    session.model.cols = cols;
    session.model.rows = rows;
    session.model.lastActiveAt = new Date().toISOString();
    return session.model;
  }

  public input(id: string, request: TerminalInputRequest): TerminalModel {
    const session = this.requireRunningSession(id);
    session.ptyProcess?.write(request.data);
    session.model.lastActiveAt = new Date().toISOString();
    return session.model;
  }

  public async stop(id: string): Promise<TerminalModel> {
    const session = this.requireSession(id);
    if (session.ptyProcess) {
      session.ptyProcess.kill();
      session.ptyProcess = null;
    }
    session.model.status = "stopped";
    session.model.lastActiveAt = new Date().toISOString();
    this.broadcast(session, { type: "status", status: "stopped" });
    await this.persist(session.model);
    return session.model;
  }

  public async delete(id: string): Promise<{ id: string }> {
    if (this.sessions.has(id)) {
      await this.stop(id).catch(() => undefined);
      this.sessions.delete(id);
    }
    await fs.promises.rm(this.metadataPath(id), { force: true });
    return { id };
  }

  public attachWebSocket(id: string, socket: WebSocket): void {
    const session = this.requireSession(id);
    session.clients.add(socket);
    this.send(socket, { type: "status", status: session.model.status });
    socket.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as TerminalClientMessage;
        this.handleClientMessage(session, message);
      } catch {
        this.send(socket, { type: "error", message: "Invalid terminal message." });
      }
    });
    socket.on("close", () => {
      session.clients.delete(socket);
    });
  }

  public runningCount(): number {
    return this.list().filter((session) => session.status === "running").length;
  }

  private handleClientMessage(session: Session, message: TerminalClientMessage): void {
    if (message.type === "ping") {
      this.sendToSession(session, { type: "pong" });
      return;
    }
    if (message.type === "resize") {
      this.resize(session.model.id, { cols: message.cols, rows: message.rows });
      return;
    }
    if (message.type === "input") {
      this.input(session.model.id, { data: message.data });
    }
  }

  private commandFor(request: CreateTerminalRequest): { command: string; args: string[] } {
    if (request.type === "codex" && process.env.CODEX_STUB === "1") {
      return { command: "/bin/bash", args: ["-lc", "printf 'Codex stub ready\\n'; exec /bin/bash -l"] };
    }
    return shellCommandFor(request.type, request.command);
  }

  private requireSession(id: string): Session {
    const session = this.sessions.get(id);
    if (!session) {
      throw new SafeError("TERMINAL_NOT_FOUND", "Terminal session was not found.", 404);
    }
    return session;
  }

  private requireRunningSession(id: string): Session {
    const session = this.requireSession(id);
    if (!session.ptyProcess || session.model.status !== "running") {
      throw new SafeError("TERMINAL_NOT_RUNNING", "Terminal session is not running.", 409);
    }
    return session;
  }

  private sendToSession(session: Session, message: TerminalServerMessage): void {
    this.broadcast(session, message);
  }

  private broadcast(session: Session, message: TerminalServerMessage): void {
    for (const client of session.clients) {
      this.send(client, message);
    }
  }

  private send(socket: WebSocket, message: TerminalServerMessage): void {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(message));
    }
  }

  private scheduleIdleCleanup(session: Session): void {
    if (session.idleTimer) {
      clearTimeout(session.idleTimer);
    }
    const timeoutMs = this.options.terminal_idle_timeout_minutes * 60 * 1000;
    session.idleTimer = setTimeout(() => {
      if (session.model.status === "running") {
        void this.stop(session.model.id);
      }
    }, timeoutMs);
  }

  private async persist(model: TerminalModel): Promise<void> {
    if (!this.options.allow_terminal_persistence) {
      return;
    }
    await ensureDir(path.join(this.options.app_data_dir, "sessions"));
    await fs.promises.writeFile(this.metadataPath(model.id), JSON.stringify(model, null, 2), "utf8");
  }

  private async getNodePty(): Promise<NodePtyModule> {
    if (nodePty) {
      return nodePty;
    }
    try {
      const imported = await import("node-pty");
      nodePty = imported;
      return imported;
    } catch {
      throw new SafeError(
        "TERMINAL_PTY_UNAVAILABLE",
        "The terminal backend module is unavailable in this image. Please check the add-on build and native PTY support.",
        503,
      );
    }
  }

  private metadataPath(id: string): string {
    return path.join(this.options.app_data_dir, "sessions", `${id}.json`);
  }
}
