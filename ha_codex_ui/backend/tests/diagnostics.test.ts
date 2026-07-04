import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultOptions } from "../src/config/addonOptions.js";
import { CodexService } from "../src/services/codexService.js";
import { DiagnosticsService } from "../src/services/diagnosticsService.js";
import { TerminalService } from "../src/services/terminalService.js";
import { WorkspaceService } from "../src/services/workspaceService.js";

describe("DiagnosticsService", () => {
  it("redacts supervisor token presence and reports policy", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-diag-"));
    const options = { ...defaultOptions(), app_data_dir: path.join(root, ".data"), codex_home: path.join(root, ".data", ".codex"), default_workspace: root, upload_workspace: path.join(root, "uploads"), allowed_workspaces: [root] };
    const workspaceService = new WorkspaceService(options);
    const terminalService = new TerminalService(options);
    const diagnostics = new DiagnosticsService(options, workspaceService, new CodexService(options), terminalService);
    const original = process.env.SUPERVISOR_TOKEN;
    process.env.SUPERVISOR_TOKEN = "redacted-test-token";
    const report = await diagnostics.report({ "x-ha-ingress-path": "/api/hassio_ingress/example" });
    process.env.SUPERVISOR_TOKEN = original;
    expect(JSON.stringify(report)).not.toContain("redacted-test-token");
    expect(report.effectivePolicy.maxTerminalSessions).toBe(options.max_terminal_sessions);
  });
});
