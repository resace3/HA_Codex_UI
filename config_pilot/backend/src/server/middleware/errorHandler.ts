import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fail, SafeError } from "../../types/api.js";
import { redactSecrets } from "../../security/secretRedaction.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof SafeError) {
      void reply.status(error.statusCode).send(fail(error.code, error.message));
      return;
    }
    const status = typeof error.statusCode === "number" && error.statusCode >= 400 ? error.statusCode : 500;
    app.log.error({ err: redactSecrets(error.message) }, "Request failed");
    void reply.status(status).send(fail("INTERNAL_ERROR", "The request failed safely. Check add-on logs for redacted diagnostics."));
  });
}
