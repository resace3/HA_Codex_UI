import { Edit3, Trash2 } from "lucide-react";
import type { Workspace } from "../api/types";

type Props = {
  selectedWorkspace: Workspace | null;
};

export default function FileActions({ selectedWorkspace }: Props) {
  return (
    <div className="action-strip">
      <button type="button" disabled={!selectedWorkspace?.writable} title="Rename">
        <Edit3 size={16} /> Rename
      </button>
      <button type="button" disabled={!selectedWorkspace?.writable} className="danger" title="Delete">
        <Trash2 size={16} /> Delete
      </button>
    </div>
  );
}
