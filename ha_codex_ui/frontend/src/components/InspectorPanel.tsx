import { RefreshCcw, ShieldCheck } from "lucide-react";
import type { CodexStatus, DiagnosticsReport, DiffStatus, Workspace } from "../api/types";
import DiagnosticsPanel from "./DiagnosticsPanel";
import DiffViewer from "./DiffViewer";

type Props = {
  diagnostics: DiagnosticsReport | null;
  codexStatus: CodexStatus | null;
  diffStatus: DiffStatus | null;
  selectedWorkspace: Workspace | null;
  onRefresh: () => void;
};

export default function InspectorPanel({ diagnostics, codexStatus, diffStatus, selectedWorkspace, onRefresh }: Props) {
  return (
    <aside className="inspector">
      <div className="panel-heading">
        <h2>Inspector</h2>
        <button type="button" onClick={onRefresh} title="Refresh">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>
      <section className="policy-summary">
        <h3><ShieldCheck size={16} /> Policy</h3>
        <p>{selectedWorkspace?.writable ? "Writable workspace" : "Read-only workspace"}</p>
        <p>{selectedWorkspace?.sensitive ? "Sensitive workspace" : "Standard workspace"}</p>
      </section>
      <section className="codex-status">
        <h3>Codex</h3>
        <p>{codexStatus?.installed ? `Installed ${codexStatus.version ?? ""}` : "Not detected"}</p>
        <p>Auth: {codexStatus?.authState ?? "unknown"}</p>
      </section>
      <DiffViewer diffStatus={diffStatus} />
      <DiagnosticsPanel diagnostics={diagnostics} />
    </aside>
  );
}
