import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  DEFAULT_CODEX_HOME,
  DEFAULT_DATA_DIR,
  DEFAULT_UPLOAD_WORKSPACE,
  DEFAULT_WORKSPACE,
} from "./paths.js";

const optionsSchema = z.object({
  default_workspace: z.string().default(DEFAULT_WORKSPACE),
  upload_workspace: z.string().default(DEFAULT_UPLOAD_WORKSPACE),
  allowed_workspaces: z.array(z.string()).default([DEFAULT_WORKSPACE, DEFAULT_UPLOAD_WORKSPACE, "/config"]),
  allow_config_write: z.boolean().default(false),
  allow_addons_write: z.boolean().default(false),
  allow_backup_write: z.boolean().default(false),
  allow_shell: z.boolean().default(true),
  allow_codex: z.boolean().default(true),
  allow_file_upload: z.boolean().default(true),
  allow_file_download: z.boolean().default(true),
  allow_terminal_persistence: z.boolean().default(true),
  max_upload_mb: z.number().int().min(1).max(1024).default(50),
  max_terminal_sessions: z.number().int().min(1).max(32).default(8),
  terminal_idle_timeout_minutes: z.number().int().min(5).max(1440).default(120),
  redacted_log_output: z.boolean().default(true),
  codex_install_mode: z.enum(["bundled", "external", "disabled"]).default("bundled"),
  codex_home: z.string().default(DEFAULT_CODEX_HOME),
  app_data_dir: z.string().default(DEFAULT_DATA_DIR),
  require_confirm_for_writes: z.boolean().default(true),
  require_confirm_for_config_changes: z.boolean().default(true),
  create_snapshot_before_write: z.boolean().default(true),
  log_level: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

export type AddonOptions = z.infer<typeof optionsSchema>;

export function defaultOptions(): AddonOptions {
  return optionsSchema.parse({});
}

export function loadAddonOptions(optionsPath = process.env.CONFIG_PILOT_OPTIONS ?? "/data/options.json"): AddonOptions {
  if (!fs.existsSync(optionsPath)) {
    return defaultOptions();
  }
  const raw = fs.readFileSync(optionsPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const options = optionsSchema.parse(parsed);
  return {
    ...options,
    default_workspace: path.resolve(options.default_workspace),
    upload_workspace: path.resolve(options.upload_workspace),
    allowed_workspaces: options.allowed_workspaces.map((workspace) => path.resolve(workspace)),
    codex_home: path.resolve(options.codex_home),
    app_data_dir: path.resolve(options.app_data_dir),
  };
}

export function optionsSchemaJson(): unknown {
  return optionsSchema.describe("Config Pilot add-on options");
}
