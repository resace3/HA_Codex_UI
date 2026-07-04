import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import type { MultipartFile } from "@fastify/multipart";
import { defaultOptions } from "../src/config/addonOptions.js";
import { UploadService } from "../src/services/uploadService.js";
import type { Workspace } from "../src/types/workspace.js";

function multipart(filename: string, contents: string): MultipartFile {
  return {
    filename,
    file: Readable.from([Buffer.from(contents)]),
  } as unknown as MultipartFile;
}

describe("UploadService", () => {
  let root: string;
  let workspace: Workspace;

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-upload-"));
    workspace = {
      id: "uploads",
      name: "Uploads",
      root,
      readable: true,
      writable: true,
      sensitive: false,
    };
  });

  it("streams uploads to a workspace", async () => {
    const service = new UploadService({ ...defaultOptions(), max_upload_mb: 1 });
    const result = await service.upload(workspace, ".", multipart("hello.txt", "uploaded"), false, true);
    expect(result).toEqual({ path: "hello.txt", bytes: 8 });
    await expect(fs.promises.readFile(path.join(root, "hello.txt"), "utf8")).resolves.toBe("uploaded");
  });

  it("blocks uploads when disabled", async () => {
    const service = new UploadService({ ...defaultOptions(), allow_file_upload: false });
    await expect(service.upload(workspace, ".", multipart("x.txt", "x"), false, true)).rejects.toThrow(/disabled/);
  });

  it("requires overwrite confirmation for existing files", async () => {
    await fs.promises.writeFile(path.join(root, "hello.txt"), "existing", "utf8");
    const service = new UploadService(defaultOptions());
    await expect(service.upload(workspace, ".", multipart("hello.txt", "new"), false, true)).rejects.toThrow(
      /already exists/,
    );
  });

  it("blocks uploads to read-only workspaces", async () => {
    const service = new UploadService(defaultOptions());
    await expect(
      service.upload({ ...workspace, writable: false }, ".", multipart("x.txt", "x"), false, true),
    ).rejects.toThrow(/blocked/);
  });
});
