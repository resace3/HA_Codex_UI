import { File, Folder, Link2, ShieldAlert } from "lucide-react";
import type { FileTreeEntry } from "../api/types";
import { formatBytes, shortDate } from "../utils/format";

type Props = {
  entries: FileTreeEntry[];
  onOpenFile: (path: string) => void;
  onOpenFolder: (path: string) => void;
};

export default function FileTree({ entries, onOpenFile, onOpenFolder }: Props) {
  return (
    <div className="file-tree" role="tree" aria-label="File tree">
      {entries.map((entry) => (
        <button
          type="button"
          role="treeitem"
          key={entry.path}
          className="file-row"
          disabled={entry.sensitive}
          onClick={() => (entry.type === "directory" ? onOpenFolder(entry.path) : onOpenFile(entry.path))}
        >
          {entry.sensitive ? <ShieldAlert size={16} /> : entry.type === "directory" ? <Folder size={16} /> : entry.type === "symlink" ? <Link2 size={16} /> : <File size={16} />}
          <span className="file-name">{entry.name}</span>
          <span className="file-meta">{formatBytes(entry.size)}</span>
          <span className="file-meta hide-narrow">{shortDate(entry.modifiedAt)}</span>
        </button>
      ))}
      {entries.length === 0 && <p className="empty-state">No files.</p>}
    </div>
  );
}
