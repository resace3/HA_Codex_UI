import type { FastifyInstance } from "fastify";
import { stripIngressPrefix } from "../ingress.js";

export function registerIngressRewrite(app: FastifyInstance): void {
  app.addHook("onRequest", async (request) => {
    const original = request.raw.url ?? "";
    const stripped = stripIngressPrefix(original, request.headers);
    if (stripped !== original) {
      request.raw.url = stripped;
    }
  });
}
