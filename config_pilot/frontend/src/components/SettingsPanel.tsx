import type { Workspace } from "../api/types";

type Props = {
  settings: Record<string, unknown> | null;
  selectedWorkspace: Workspace | null;
};

export default function SettingsPanel({ settings, selectedWorkspace }: Props) {
  return (
    <aside className="settings-panel">
      <h2>Settings</h2>
      <dl>
        <dt>Workspace</dt>
        <dd>{selectedWorkspace?.root ?? "None"}</dd>
        <dt>Write access</dt>
        <dd>{selectedWorkspace?.writable ? "Allowed" : "Denied"}</dd>
        <dt>Upload limit</dt>
        <dd>{String(settings?.max_upload_mb ?? 50)} MiB</dd>
        <dt>Terminal limit</dt>
        <dd>{String(settings?.max_terminal_sessions ?? 8)}</dd>
        <dt>Local execution</dt>
        <dd>GitHub Actions only.</dd>
      </dl>
    </aside>
  );
}
