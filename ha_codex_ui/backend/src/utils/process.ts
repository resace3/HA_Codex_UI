import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function commandExists(command: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("command", ["-v", command], { shell: "/bin/bash" });
    return stdout.trim() || null;
  } catch {
    try {
      const { stdout } = await execFileAsync("which", [command]);
      return stdout.trim() || null;
    } catch {
      const searchRoots = [
        process.env.HOME,
        "/usr/local/bin",
        "/usr/bin",
        "/bin",
      ].filter((value): value is string => typeof value === "string" && value.length > 0);
      for (const root of searchRoots) {
        const fullPath = path.join(root, command);
        try {
          await access(fullPath, constants.X_OK);
          return fullPath;
        } catch {
          // continue
        }
      }
      return null;
    }
  }
}
}

export async function safeExecFile(command: string, args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      timeout: 15000,
      maxBuffer: 1024 * 1024,
      env: process.env,
    });
    return { stdout, stderr, code: 0 };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
    return { stdout: err.stdout ?? "", stderr: err.stderr ?? "", code: typeof err.code === "number" ? err.code : 1 };
  }
}
