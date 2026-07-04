import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import type { FastifyReply } from "fastify";
import { ArchiveService } from "../src/services/archiveService.js";
import type { Workspace } from "../src/types/workspace.js";

function replySink(): { reply: FastifyReply; headers: Record<string, string>; chunks: Buffer[] } {
  const headers: Record<string, string> = {};
  const chunks: Buffer[] = [];
  const raw = new PassThrough();
  raw.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });
  const reply = {
    raw,
    header(name: string, value: string) {
      headers[name] = value;
      return this;
    },
  } as unknown as FastifyReply;
  return { reply, headers, chunks };
}

describe("ArchiveService", () => {
  let root: string;
  let workspace: Workspace;

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ha-codex-ui-archive-"));
    workspace = {
      id: "archive",
      name: "Archive",
      root,
      readable: true,
      writable: true,
      sensitive: false,
    };
  });

  it("streams a zip for a single file", async () => {
    const source = path.join(root, "hello.txt");
    await fs.promises.writeFile(source, "hello", "utf8");
    const sink = replySink();
    await new ArchiveService().streamZip(workspace, source, sink.reply);
    expect(sink.headers["Content-Type"]).toBe("application/zip");
    expect(sink.headers["Content-Disposition"]).toContain("hello.txt.zip");
    expect(Buffer.concat(sink.chunks).length).toBeGreaterThan(0);
  });

  it("streams a zip for a directory while skipping sensitive entries", async () => {
    await fs.promises.mkdir(path.join(root, "folder"));
    await fs.promises.mkdir(path.join(root, "folder", ".ssh"));
    await fs.promises.writeFile(path.join(root, "folder", "safe.txt"), "safe", "utf8");
    await fs.promises.writeFile(path.join(root, "folder", ".ssh", "id_rsa"), "blocked", "utf8");
    const sink = replySink();
    await new ArchiveService().streamZip(workspace, path.join(root, "folder"), sink.reply);
    expect(sink.headers["Content-Disposition"]).toContain("folder.zip");
    expect(Buffer.concat(sink.chunks).length).toBeGreaterThan(0);
  });
});
