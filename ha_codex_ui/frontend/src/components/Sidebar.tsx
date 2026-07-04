import type { FileTreeEntry, Workspace } from "../api/types";
import FileBrowser from "./FileBrowser";
import WorkspacePicker from "./WorkspacePicker";

type Props = {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onWorkspaceChange: (id: string) => void;
  currentPath: string;
  onPathChange: (path: string) => void;
  fileTree: FileTreeEntry[];
  onRefresh: () => void;
  onOpenFile: (path: string) => void;
};

export default function Sidebar(props: Props) {
  return (
    <aside className="sidebar">
      <WorkspacePicker workspaces={props.workspaces} selectedWorkspace={props.selectedWorkspace} onWorkspaceChange={props.onWorkspaceChange} />
      <FileBrowser
        currentPath={props.currentPath}
        onPathChange={props.onPathChange}
        fileTree={props.fileTree}
        onRefresh={props.onRefresh}
        onOpenFile={props.onOpenFile}
        selectedWorkspace={props.selectedWorkspace}
      />
    </aside>
  );
}
