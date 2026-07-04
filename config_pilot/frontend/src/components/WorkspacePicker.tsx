import { FolderKanban } from "lucide-react";
import type { Workspace } from "../api/types";

type Props = {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onWorkspaceChange: (id: string) => void;
};

export default function WorkspacePicker({ workspaces, selectedWorkspace, onWorkspaceChange }: Props) {
  return (
    <section className="workspace-picker" aria-label="Workspace">
      <label htmlFor="workspace-select">
        <FolderKanban size={16} /> Workspace
      </label>
      <select id="workspace-select" value={selectedWorkspace?.id ?? ""} onChange={(event) => onWorkspaceChange(event.target.value)}>
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
            {workspace.writable ? "" : " (read-only)"}
          </option>
        ))}
      </select>
      {selectedWorkspace?.reason && <p className="panel-note">{selectedWorkspace.reason}</p>}
    </section>
  );
}
