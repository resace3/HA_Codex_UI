import fs from "node:fs";
import path from "node:path";

export async function ensureDir(dir: string, mode?: number): Promise<void> {
  await fs.promises.mkdir(dir, { recursive: true, mode });
  if (mode !== undefined) {
    await fs.promises.chmod(dir, mode);
  }
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.promises.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function isWritable(dir: string): Promise<boolean> {
  try {
    await fs.promises.access(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function isReadable(dir: string): Promise<boolean> {
  try {
    await fs.promises.access(dir, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function displayNameForPath(input: string): string {
  const normalized = path.resolve(input);
  if (normalized === "/") {
    return "/";
  }
  return path.basename(normalized) || normalized;
}

export async function safeStat(target: string): Promise<fs.Stats | null> {
  try {
    return await fs.promises.stat(target);
  } catch {
    return null;
  }
}
