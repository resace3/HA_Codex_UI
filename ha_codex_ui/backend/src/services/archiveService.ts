import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";
import type { FastifyReply } from "fastify";
import { isSensitivePath, sanitizeArchivePath } from "../security/pathPolicy.js";
import type { Workspace } from "../types/workspace.js";
import { SafeError } from "../types/api.js";

export class ArchiveService {
  public async streamZip(workspace: Workspace, sourcePath: string, reply: FastifyReply): Promise<void> {
    const stat = await fs.promises.stat(sourcePath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    const baseName = path.basename(sourcePath) || "workspace";
    reply.header("Content-Type", "application/zip");
    reply.header("Content-Disposition", `attachment; filename="${baseName}.zip"`);
    archive.on("warning", (error) => {
      throw error;
    });
    archive.on("error", (error) => {
      throw error;
    });
    archive.pipe(reply.raw);
    if (stat.isDirectory()) {
      await this.addDirectory(archive, sourcePath, sourcePath);
    } else if (stat.isFile()) {
      await this.addFile(archive, sourcePath, path.basename(sourcePath));
    } else {
      throw new SafeError("UNSUPPORTED_ARCHIVE_SOURCE", "Only files and folders can be downloaded as zip.", 400);
    }
    await archive.finalize();
  }

  private async addDirectory(archive: archiver.Archiver, root: string, current: string): Promise<void> {
    const entries = await fs.promises.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const source = path.join(current, entry.name);
      if (entry.name === ".git" || entry.name === "node_modules" || isSensitivePath(source)) {
        continue;
      }
      const relative = sanitizeArchivePath(path.relative(root, source));
      if (entry.isDirectory()) {
        await this.addDirectory(archive, root, source);
      } else if (entry.isFile()) {
        await this.addFile(archive, source, relative);
      }
    }
  }

  private async addFile(archive: archiver.Archiver, source: string, archivePath: string): Promise<void> {
    if (isSensitivePath(source)) {
      return;
    }
    const safeArchivePath = sanitizeArchivePath(archivePath);
    archive.file(source, { name: safeArchivePath });
  }
}
