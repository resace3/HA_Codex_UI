export function validateUploadSize(file: File, maxMb: number): string | null {
  const maxBytes = maxMb * 1024 * 1024;
  return file.size > maxBytes ? `File exceeds ${maxMb} MiB.` : null;
}

export function requiresDangerConfirmation(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.includes("/config") || lower.endsWith("configuration.yaml") || lower.endsWith("automations.yaml");
}
