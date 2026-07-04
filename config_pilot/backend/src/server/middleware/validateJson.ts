import type { FastifyRequest } from "fastify";
import type { z } from "zod";
import { parseOrThrow } from "../../utils/validation.js";

export function body<T>(request: FastifyRequest, schema: z.ZodType<T>): T {
  return parseOrThrow(schema, request.body);
}

export function query<T>(request: FastifyRequest, schema: z.ZodType<T>): T {
  return parseOrThrow(schema, request.query);
}
