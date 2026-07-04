import { Archive, Download } from "lucide-react";
import type { Workspace } from "../api/types";
import { apiPath } from "../utils/paths";

type Props = {
  selectedWorkspace: Workspace | null;
  currentPath: string;
};

export default function DownloadPanel({ selectedWorkspace, currentPath }: Props) {
  const disabled = !selectedWorkspace;
  const encodedWorkspace = encodeURIComponent(selectedWorkspace?.id ?? "");
  const encodedPath = encodeURIComponent(currentPath);
  return (
    <section className="mini-panel">
      <h3>Download</h3>
      <div className="action-strip">
        <a aria-disabled={disabled} href={disabled ? undefined : apiPath(`/api/files/download?workspaceId=${encodedWorkspace}&path=${encodedPath}`)}>
          <Download size={16} /> File
        </a>
        <a aria-disabled={disabled} href={disabled ? undefined : apiPath(`/api/files/download-zip?workspaceId=${encodedWorkspace}&path=${encodedPath}`)}>
          <Archive size={16} /> Zip
        </a>
      </div>
    </section>
  );
}
