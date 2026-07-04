import { Activity, FileText, PanelRight, Settings, TerminalSquare } from "lucide-react";
import type { CodexStatus, DiagnosticsReport, DiffStatus, FileReadResult, FileTreeEntry, TerminalModel, Workspace } from "../api/types";
import type { Toast } from "../App";
import Sidebar from "./Sidebar";
import EditorPanel from "./EditorPanel";
import TerminalTabs from "./TerminalTabs";
import InspectorPanel from "./InspectorPanel";
import SettingsPanel from "./SettingsPanel";
import StatusBar from "./StatusBar";
import Toasts from "./Toasts";

type MobileTab = "files" | "terminal" | "inspector" | "settings";

type Props = {
  layout: "desktop" | "mobile";
  activeMobileTab: MobileTab;
  onMobileTabChange: (tab: MobileTab) => void;
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onWorkspaceChange: (id: string) => void;
  currentPath: string;
  onPathChange: (path: string) => void;
  fileTree: FileTreeEntry[];
  onRefreshFiles: () => void;
  onOpenFile: (path: string) => void;
  selectedFile: FileReadResult | null;
  editorText: string;
  dirty: boolean;
  onEditorChange: (value: string) => void;
  onSaveFile: (confirmed?: boolean) => void;
  terminals: TerminalModel[];
  activeTerminalId: string | null;
  onActiveTerminalChange: (id: string) => void;
  onNewShell: () => void;
  onNewCodex: (prompt?: string) => void;
  onStopTerminal: (id: string) => void;
  onCloseTerminal: (id: string) => void;
  diagnostics: DiagnosticsReport | null;
  settings: Record<string, unknown> | null;
  codexStatus: CodexStatus | null;
  diffStatus: DiffStatus | null;
  onRefreshAll: () => void;
  toasts: Toast[];
  onDismissToast: (id: number) => void;
};

export default function AppShell(props: Props) {
  const terminalPanel = (
    <div className="center-stack">
      <EditorPanel file={props.selectedFile} value={props.editorText} dirty={props.dirty} onChange={props.onEditorChange} onSave={props.onSaveFile} />
      <TerminalTabs
        terminals={props.terminals}
        activeTerminalId={props.activeTerminalId}
        onActiveTerminalChange={props.onActiveTerminalChange}
        onNewShell={props.onNewShell}
        onNewCodex={props.onNewCodex}
        onStopTerminal={props.onStopTerminal}
        onCloseTerminal={props.onCloseTerminal}
      />
    </div>
  );

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">
          <Activity size={22} aria-hidden="true" />
          <h1>Config Pilot</h1>
        </div>
        <div className="connection-pill" data-status={props.diagnostics ? "ok" : "loading"}>
          {props.diagnostics ? "Connected" : "Connecting"}
        </div>
      </header>

      {props.layout === "mobile" && (
        <nav className="mobile-tabs" aria-label="Primary">
          <button type="button" aria-pressed={props.activeMobileTab === "files"} onClick={() => props.onMobileTabChange("files")}>
            <FileText size={18} /> Files
          </button>
          <button type="button" aria-pressed={props.activeMobileTab === "terminal"} onClick={() => props.onMobileTabChange("terminal")}>
            <TerminalSquare size={18} /> Terminal
          </button>
          <button type="button" aria-pressed={props.activeMobileTab === "inspector"} onClick={() => props.onMobileTabChange("inspector")}>
            <PanelRight size={18} /> Inspector
          </button>
          <button type="button" aria-pressed={props.activeMobileTab === "settings"} onClick={() => props.onMobileTabChange("settings")}>
            <Settings size={18} /> Settings
          </button>
        </nav>
      )}

      <main className={props.layout === "mobile" ? "workspace mobile" : "workspace"}>
        {(props.layout === "desktop" || props.activeMobileTab === "files") && (
          <Sidebar
            workspaces={props.workspaces}
            selectedWorkspace={props.selectedWorkspace}
            onWorkspaceChange={props.onWorkspaceChange}
            currentPath={props.currentPath}
            onPathChange={props.onPathChange}
            fileTree={props.fileTree}
            onRefresh={props.onRefreshFiles}
            onOpenFile={props.onOpenFile}
          />
        )}
        {(props.layout === "desktop" || props.activeMobileTab === "terminal") && terminalPanel}
        {(props.layout === "desktop" || props.activeMobileTab === "inspector") && (
          <InspectorPanel diagnostics={props.diagnostics} codexStatus={props.codexStatus} diffStatus={props.diffStatus} selectedWorkspace={props.selectedWorkspace} onRefresh={props.onRefreshAll} />
        )}
        {props.layout === "mobile" && props.activeMobileTab === "settings" && <SettingsPanel settings={props.settings} selectedWorkspace={props.selectedWorkspace} />}
      </main>

      {props.layout === "desktop" && <StatusBar selectedWorkspace={props.selectedWorkspace} dirty={props.dirty} terminalCount={props.terminals.length} />}
      <Toasts toasts={props.toasts} onDismiss={props.onDismissToast} />
    </div>
  );
}
