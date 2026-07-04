import type { FastifyInstance } from "fastify";
import { redactPathForLog } from "../../security/pathPolicy.js";

export function registerRequestLogger(app: FastifyInstance): void {
  app.addHook("onRequest", async (request) => {
    request.log.info({ method: request.method, url: redactPathForLog(request.url) }, "request");
  });
}
