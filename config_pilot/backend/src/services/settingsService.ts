import type { AddonOptions } from "../config/addonOptions.js";

export class SettingsService {
  public constructor(private readonly options: AddonOptions) {}

  public effectiveSettings(): Record<string, unknown> {
    return {
      default_workspace: this.options.default_workspace,
      upload_workspace: this.options.upload_workspace,
      allowed_workspaces: this.options.allowed_workspaces,
      allow_config_write: this.options.allow_config_write,
      allow_addons_write: this.options.allow_addons_write,
      allow_backup_write: this.options.allow_backup_write,
      allow_shell: this.options.allow_shell,
      allow_codex: this.options.allow_codex,
      allow_file_upload: this.options.allow_file_upload,
      allow_file_download: this.options.allow_file_download,
      max_upload_mb: this.options.max_upload_mb,
      max_terminal_sessions: this.options.max_terminal_sessions,
      terminal_idle_timeout_minutes: this.options.terminal_idle_timeout_minutes,
      codex_install_mode: this.options.codex_install_mode,
      codex_home: this.options.codex_home,
      app_data_dir: this.options.app_data_dir,
      require_confirm_for_writes: this.options.require_confirm_for_writes,
      require_confirm_for_config_changes: this.options.require_confirm_for_config_changes,
      create_snapshot_before_write: this.options.create_snapshot_before_write,
      security_note: "Sensitive Home Assistant folders are read-only by default. Edit add-on options in Home Assistant to change behavior.",
    };
  }
}
