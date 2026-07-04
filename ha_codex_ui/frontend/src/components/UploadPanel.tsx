import { useState } from "react";
import { UploadCloud } from "lucide-react";
import type { Workspace } from "../api/types";
import { validateUploadSize } from "../utils/validation";

type Props = {
  selectedWorkspace: Workspace | null;
  currentPath: string;
};

export default function UploadPanel({ selectedWorkspace, currentPath }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const maxMb = 50;
  return (
    <section className="mini-panel">
      <h3>Upload</h3>
      <label className="file-input">
        <UploadCloud size={16} />
        <span>Select file</span>
        <input
          type="file"
          disabled={!selectedWorkspace?.writable}
          onChange={(event) => {
            const file = event.target.files?.[0];
            setMessage(file ? validateUploadSize(file, maxMb) ?? `${file.name} ready for ${currentPath}.` : null);
          }}
        />
      </label>
      {message && <p className="panel-note">{message}</p>}
    </section>
  );
}
