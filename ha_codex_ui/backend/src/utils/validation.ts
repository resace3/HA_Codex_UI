import { z } from "zod";
import { SafeError } from "../types/api.js";

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new SafeError("INVALID_REQUEST", parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }
  return parsed.data;
}

export const workspacePathQuerySchema = z.object({
  workspaceId: z.string().min(1),
  path: z.string().default("."),
});
