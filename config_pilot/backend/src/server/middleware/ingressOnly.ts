import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isTruthy } from "../../config/env.js";

export function registerIngressOnly(app: FastifyInstance): void {
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    if (process.env.NODE_ENV === "test" || isTruthy(process.env.CONFIG_PILOT_DIRECT_ACCESS) || isTruthy(process.env.CONFIG_PILOT_TEST_MODE)) {
      return;
    }
    const host = request.headers.host ?? "";
    const hasIngressHeader = Object.keys(request.headers).some((header) => header.toLowerCase().startsWith("x-ingress") || header.toLowerCase() === "x-ha-ingress-path");
    const localHost = host.startsWith("127.0.0.1") || host.startsWith("localhost") || host.includes("homeassistant");
    if (hasIngressHeader || localHost) {
      return;
    }
    await reply.status(403).send({
      ok: false,
      error: {
        code: "INGRESS_REQUIRED",
        message: "Config Pilot is intended to run behind Home Assistant Ingress.",
      },
    });
  });
}
