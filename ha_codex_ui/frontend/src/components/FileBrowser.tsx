import { Download, FilePlus2, FolderPlus, RefreshCcw, Upload } from "lucide-react";
import type { FileTreeEntry, Workspace } from "../api/types";
import FileActions from "./FileActions";
import FileTree from "./FileTree";
import UploadPanel from "./UploadPanel";
import DownloadPanel from "./DownloadPanel";

type Props = {
  currentPath: string;
  onPathChange: (path: string) => void;
  fileTree: FileTreeEntry[];
  onRefresh: () => void;
  onOpenFile: (path: string) => void;
  selectedWorkspace: Workspace | null;
};

export default function FileBrowser({ currentPath, onPathChange, fileTree, onRefresh, onOpenFile, selectedWorkspace }: Props) {
  return (
    <section className="file-browser">
      <div className="panel-heading">
        <h2>Files</h2>
        <button type="button" className="icon-button" onClick={onRefresh} title="Refresh">
          <RefreshCcw size={16} />
        </button>
      </div>
      <div className="breadcrumbs">
        <button type="button" onClick={() => onPathChange(".")}>root</button>
        <span>{currentPath === "." ? "" : currentPath}</span>
      </div>
      <div className="toolbar">
        <button type="button" title="Upload">
          <Upload size={16} /> Upload
        </button>
        <button type="button" title="Download">
          <Download size={16} /> Download
        </button>
        <button type="button" title="New file">
          <FilePlus2 size={16} /> File
        </button>
        <button type="button" title="New folder">
          <FolderPlus size={16} /> Folder
        </button>
      </div>
      <FileTree entries={fileTree} onOpenFile={onOpenFile} onOpenFolder={onPathChange} />
      <FileActions selectedWorkspace={selectedWorkspace} />
      <UploadPanel selectedWorkspace={selectedWorkspace} currentPath={currentPath} />
      <DownloadPanel selectedWorkspace={selectedWorkspace} currentPath={currentPath} />
    </section>
  );
}
