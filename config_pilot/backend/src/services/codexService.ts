import fs from "node:fs";
import path from "node:path";
import type { AddonOptions } from "../config/addonOptions.js";
import { DEFAULT_CODEX_HOME } from "../config/paths.js";
import { ensureDir } from "../utils/fs.js";
import { commandExists, safeExecFile } from "../utils/process.js";

export type CodexStatus = {
  installed: boolean;
  version: string | null;
  path: string | null;
  authState: "unknown" | "likely_authenticated" | "not_authenticated";
  codexHome: string;
};

export class CodexService {
  public constructor(private readonly options: AddonOptions) {}

  public async ensureCodexHome(): Promise<void> {
    const codexHome = this.options.codex_home || DEFAULT_CODEX_HOME;
    await ensureDir(codexHome, 0o700);
  }

  public async status(): Promise<CodexStatus> {
    await this.ensureCodexHome();
    const codexPath = await commandExists("codex");
    const version = codexPath ? await this.version() : null;
    return {
      installed: Boolean(codexPath),
      version,
      path: codexPath,
      authState: await this.authState(),
      codexHome: this.options.codex_home,
    };
  }

  public async checkAuth(): Promise<{ authState: CodexStatus["authState"]; message: string }> {
    const authState = await this.authState();
    if (authState === "likely_authenticated") {
      return { authState, message: "Codex authentication files appear to exist. Contents are never displayed." };
    }
    if (authState === "not_authenticated") {
      return { authState, message: "Codex authentication was not detected. Sign in through a Codex terminal session." };
    }
    return { authState, message: "Codex authentication could not be determined safely." };
  }

  private async version(): Promise<string | null> {
    const result = await safeExecFile("codex", ["--version"]);
    if (result.code !== 0) {
      return null;
    }
    return result.stdout.trim() || result.stderr.trim() || null;
  }

  private async authState(): Promise<CodexStatus["authState"]> {
    const home = this.options.codex_home;
    try {
      const entries = await fs.promises.readdir(home);
      const authFiles = entries.filter((entry) => {
        const lower = entry.toLowerCase();
        return lower.includes("auth") || lower.includes("token") || lower.includes("credentials");
      });
      return authFiles.length > 0 ? "likely_authenticated" : "not_authenticated";
    } catch {
      return "unknown";
    }
  }
}
