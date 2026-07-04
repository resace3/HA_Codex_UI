import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultOptions } from "../src/config/addonOptions.js";
import { CodexService } from "../src/services/codexService.js";

describe("CodexService", () => {
  it("detects missing auth without exposing files", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "config-pilot-codex-"));
    const service = new CodexService({ ...defaultOptions(), codex_home: path.join(root, ".codex") });
    const status = await service.status();
    expect(status.codexHome).toContain(".codex");
    expect(["unknown", "not_authenticated", "likely_authenticated"]).toContain(status.authState);
  });

  it("detects likely auth from file names only", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "config-pilot-codex-auth-"));
    const codexHome = path.join(root, ".codex");
    await fs.promises.mkdir(codexHome, { recursive: true });
    await fs.promises.writeFile(path.join(codexHome, "auth.json"), "{\"redacted\":true}", "utf8");
    const service = new CodexService({ ...defaultOptions(), codex_home: codexHome });
    expect((await service.checkAuth()).authState).toBe("likely_authenticated");
  });
});
