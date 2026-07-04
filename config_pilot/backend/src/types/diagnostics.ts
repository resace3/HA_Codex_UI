export type DiagnosticStatus = "pass" | "warn" | "fail" | "unknown";

export type DiagnosticCheck = {
  id: string;
  label: string;
  status: DiagnosticStatus;
  message: string;
  details?: Record<string, unknown>;
};

export type DiagnosticsReport = {
  service: "config-pilot";
  version: string;
  checks: DiagnosticCheck[];
  effectivePolicy: Record<string, unknown>;
  generatedAt: string;
};
