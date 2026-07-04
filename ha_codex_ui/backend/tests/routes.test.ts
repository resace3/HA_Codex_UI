import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultOptions } from "../src/config/addonOptions.js";
import { buildApp } from "../src/server/app.js";
import { workspaceIdForRoot } from "../src/services/workspaceService.js";

describe("routes", () => {
  it("serves health and file manager APIs", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-routes-"));
    await fs.promises.writeFile(path.join(root, "hello.txt"), "hello", "utf8");
    const workspaceId = workspaceIdForRoot(root);
    const { app } = await buildApp({
      ...defaultOptions(),
      app_data_dir: path.join(root, ".data"),
      codex_home: path.join(root, ".data", ".codex"),
      default_workspace: root,
      upload_workspace: path.join(root, "uploads"),
      allowed_workspaces: [root],
    });
    const health = await app.inject({ method: "GET", url: "/api/health" });
    expect(health.json().ok).toBe(true);
    const tree = await app.inject({ method: "GET", url: `/api/files/tree?workspaceId=${workspaceId}&path=.` });
    expect(tree.statusCode).toBe(200);
    const read = await app.inject({
      method: "GET",
      url: `/api/files/read?workspaceId=${workspaceId}&path=hello.txt`,
    });
    expect(read.json().data.text).toBe("hello");
    const write = await app.inject({
      method: "PUT",
      url: "/api/files/write",
      payload: {
        workspaceId,
        path: "saved.txt",
        contents: "saved",
        confirmed: true,
      },
    });
    expect(write.statusCode).toBe(200);
    const mkdir = await app.inject({
      method: "POST",
      url: "/api/files/mkdir",
      payload: { workspaceId, path: "folder", confirmed: true },
    });
    expect(mkdir.statusCode).toBe(200);
    const rename = await app.inject({
      method: "POST",
      url: "/api/files/rename",
      payload: { workspaceId, fromPath: "saved.txt", toPath: "folder/renamed.txt", confirmed: true },
    });
    expect(rename.statusCode).toBe(200);
    const download = await app.inject({
      method: "GET",
      url: `/api/files/download?workspaceId=${workspaceId}&path=folder/renamed.txt`,
    });
    expect(download.headers["content-disposition"]).toContain("renamed.txt");
    expect(download.body).toBe("saved");
    const zip = await app.inject({
      method: "GET",
      url: `/api/files/download-zip?workspaceId=${workspaceId}&path=folder`,
    });
    expect(zip.headers["content-type"]).toContain("application/zip");
    const deleteWithoutConfirm = await app.inject({
      method: "POST",
      url: "/api/files/delete",
      payload: { workspaceId, path: "folder/renamed.txt", confirmed: false },
    });
    expect(deleteWithoutConfirm.statusCode).toBe(409);
    const deleteFile = await app.inject({
      method: "POST",
      url: "/api/files/delete",
      payload: { workspaceId, path: "folder/renamed.txt", confirmed: true },
    });
    expect(deleteFile.statusCode).toBe(200);
    const codexStatus = await app.inject({ method: "GET", url: "/api/codex/status" });
    expect(codexStatus.statusCode).toBe(200);
    const codexAuth = await app.inject({ method: "POST", url: "/api/codex/check-auth" });
    expect(codexAuth.statusCode).toBe(200);
    const diffStatus = await app.inject({
      method: "GET",
      url: `/api/diff/status?workspaceId=${workspaceId}`,
    });
    expect(diffStatus.json().data.source).toBe("snapshot");
    const diffFile = await app.inject({
      method: "GET",
      url: `/api/diff/file?workspaceId=${workspaceId}&path=hello.txt`,
    });
    expect(diffFile.statusCode).toBe(200);
    const snapshot = await app.inject({
      method: "POST",
      url: "/api/diff/snapshot",
      payload: { workspaceId },
    });
    expect(snapshot.statusCode).toBe(200);
    const revertUnconfirmed = await app.inject({
      method: "POST",
      url: "/api/diff/revert-file",
      payload: { workspaceId, snapshotId: "missing", path: "hello.txt", confirmed: false },
    });
    expect(revertUnconfirmed.json().data.supported).toBe(false);
    const revertAll = await app.inject({ method: "POST", url: "/api/diff/revert-all" });
    expect(revertAll.statusCode).toBe(400);
    await app.close();
  });
});
