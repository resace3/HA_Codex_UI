import mime from "mime-types";

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".conf",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".html",
  ".svg",
  ".py",
  ".sh",
  ".jinja",
  ".j2",
]);

export function detectMime(filePath: string): string {
  return mime.lookup(filePath) || "application/octet-stream";
}

export function isProbablyText(filePath: string, sample?: Buffer): boolean {
  const lower = filePath.toLowerCase();
  for (const ext of TEXT_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return true;
    }
  }
  if (!sample) {
    return false;
  }
  return !sample.subarray(0, 4096).includes(0);
}
