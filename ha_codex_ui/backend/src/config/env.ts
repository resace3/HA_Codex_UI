import { z } from "zod";
import { DEFAULT_PORT } from "./paths.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT),
  HA_CODEX_UI_DIRECT_ACCESS: z.enum(["0", "1", "true", "false"]).optional(),
  HA_CODEX_UI_TEST_MODE: z.enum(["0", "1", "true", "false"]).optional(),
  SUPERVISOR_TOKEN: z.string().optional(),
  CODEX_HOME: z.string().optional(),
  CODEX_STUB: z.enum(["0", "1", "true", "false"]).optional(),
});

export type RuntimeEnv = z.infer<typeof envSchema>;

export function loadEnv(input = process.env): RuntimeEnv {
  return envSchema.parse(input);
}

export function isTruthy(value: string | undefined): boolean {
  return value === "1" || value === "true";
}
