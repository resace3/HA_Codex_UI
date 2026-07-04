import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "../src/App";

const apiPayloads: Record<string, unknown> = {
  "/api/workspaces": [
    { id: "share-workspace", name: "Workspace", root: "/share/ha_codex_ui_workspace", readable: true, writable: true, sensitive: false },
  ],
  "/api/diagnostics": {
    service: "ha-codex-ui",
    version: "0.1.0",
    checks: [{ id: "backend", label: "Backend", status: "pass", message: "ok" }],
    effectivePolicy: { maxTerminalSessions: 8 },
    generatedAt: "2026-01-01T00:00:00.000Z",
  },
  "/api/settings": { max_upload_mb: 50, max_terminal_sessions: 8 },
  "/api/codex/status": { installed: false, version: null, path: null, authState: "unknown", codexHome: "/data/ha_codex_ui/.codex" },
  "/api/terminals": [],
  "/api/files/tree?workspaceId=share-workspace&path=.": [{ name: "configuration.yaml", path: "configuration.yaml", type: "file", size: 12, modifiedAt: "2026-01-01T00:00:00.000Z", writable: true, sensitive: false }],
  "/api/diff/status?workspaceId=share-workspace": { source: "snapshot", files: [] },
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      const path = url.startsWith("http") ? new URL(url).pathname + new URL(url).search : url;
      const data = apiPayloads[path] ?? {};
      return new Response(JSON.stringify({ ok: true, data }), { headers: { "Content-Type": "application/json" } });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("renders the HA_Codex_UI title", async () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "HA_Codex_UI" })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("Connected")).toBeInTheDocument());
});

it("does not render legacy app naming", () => {
  render(<App />);
  const forbidden = ["Codex", "Studio"].join(" ");
  expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
});
