const REDACTION_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9_-]{20,}/g,
  /gh[pousr]_[A-Za-z0-9_]{20,}/g,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /("?(?:access|refresh|id)_token"?\s*[:=]\s*)["']?[^"',\s}]+["']?/gi,
  /(SUPERVISOR_TOKEN\s*[:=]\s*)[^\s]+/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

export function redactSecrets(value: string): string {
  return REDACTION_PATTERNS.reduce((current, pattern) => current.replace(pattern, "$1[redacted]"), value);
}

export function hasSecretLikeValue(value: string): boolean {
  return REDACTION_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}
