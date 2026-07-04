import type { AddonOptions } from "../config/addonOptions.js";
import { SafeError } from "../types/api.js";
import type { TerminalKind } from "../types/terminal.js";
import type { Workspace } from "../types/workspace.js";

export function assertTerminalAllowed(options: AddonOptions, kind: TerminalKind, workspace: Workspace, confirmed = false): void {
  if (kind === "shell" && !options.allow_shell) {
    throw new SafeError("SHELL_DISABLED", "Shell terminals are disabled by add-on options.", 403);
  }
  if (kind === "codex" && (!options.allow_codex || options.codex_install_mode === "disabled")) {
    throw new SafeError("CODEX_DISABLED", "Codex sessions are disabled by add-on options.", 403);
  }
  if (kind === "codex" && workspace.sensitive && !confirmed) {
    throw new SafeError("CODEX_CONFIRMATION_REQUIRED", "Starting Codex in a sensitive workspace requires explicit confirmation.", 409);
  }
}

export function shellCommandFor(kind: TerminalKind, customCommand?: string): { command: string; args: string[] } {
  if (kind === "codex") {
    return { command: "codex", args: [] };
  }
  if (customCommand?.trim()) {
    return { command: "/bin/bash", args: ["-lc", customCommand] };
  }
  return { command: "/bin/bash", args: ["-l"] };
}
