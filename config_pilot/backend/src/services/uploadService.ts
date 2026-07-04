import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { MultipartFile } from "@fastify/multipart";
import type { AddonOptions } from "../config/addonOptions.js";
import { assertWriteAllowed, resolveWorkspacePath } from "../security/pathPolicy.js";
import { SafeError } from "../types/api.js";
import type { Workspace } from "../types/workspace.js";
import { ensureDir } from "../utils/fs.js";

export class UploadService {
  public constructor(private readonly options: AddonOptions) {}

  public async upload(workspace: Workspace, requestedPath: string, file: MultipartFile, overwrite = false, confirmed = false): Promise<{ path: string; bytes: number }> {
    if (!this.options.allow_file_upload) {
      throw new SafeError("UPLOAD_DISABLED", "File uploads are disabled by add-on options.", 403);
    }
    const fileName = path.basename(file.filename || "upload.bin");
    const targetDir = resolveWorkspacePath(workspace.root, requestedPath);
    const target = resolveWorkspacePath(workspace.root, path.join(path.relative(workspace.root, targetDir), fileName));
    assertWriteAllowed({
      workspaceRoot: workspace.root,
      resolvedPath: target,
      workspaceWritable: workspace.writable,
      workspaceSensitive: workspace.sensitive,
      allowSensitiveWrite: !workspace.sensitive,
      confirmed,
    });
    if (!overwrite && fs.existsSync(target)) {
      throw new SafeError("OVERWRITE_CONFIRMATION_REQUIRED", "A file already exists at the upload destination.", 409);
    }
    await ensureDir(path.dirname(target));
    const maxBytes = this.options.max_upload_mb * 1024 * 1024;
    const temp = `${target}.config-pilot-upload-${process.pid}-${Date.now()}.tmp`;
    let bytes = 0;
    file.file.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        file.file.destroy(new SafeError("UPLOAD_TOO_LARGE", "Upload exceeds the configured size limit.", 413));
      }
    });
    await pipeline(file.file, fs.createWriteStream(temp, { mode: 0o600 }));
    await fs.promises.rename(temp, target);
    return { path: path.relative(workspace.root, target), bytes };
  }
}
