import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import type { CodexStatus, DiagnosticsReport, DiffStatus, FileReadResult, TerminalModel, Workspace } from "./api/types";
import AppShell from "./components/AppShell";
import { useFileTree } from "./hooks/useFileTree";
import { useResponsiveLayout } from "./hooks/useResponsiveLayout";
import { useTerminals } from "./hooks/useTerminal";

export type Toast = { id: number; kind: "info" | "error" | "success"; message: string };

export default function App() {
  const layout = useResponsiveLayout();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(".");
  const [selectedFile, setSelectedFile] = useState<FileReadResult | null>(null);
  const [editorText, setEditorText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsReport | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [codexStatus, setCodexStatus] = useState<CodexStatus | null>(null);
  const [diffStatus, setDiffStatus] = useState<DiffStatus | null>(null);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"files" | "terminal" | "inspector" | "settings">("files");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { tree, error: treeError, refresh: refreshTree } = useFileTree(workspaceId, currentPath);
  const { terminals, setTerminals, refresh: refreshTerminals } = useTerminals();

  const selectedWorkspace = useMemo(() => workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0] ?? null, [workspaceId, workspaces]);

  const pushToast = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items.slice(-4), { id, kind, message }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 5000);
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [workspaceList, diagnosticsReport, settingsData, codex] = await Promise.all([api.workspaces(), api.diagnostics(), api.settings(), api.codexStatus()]);
      setWorkspaces(workspaceList);
      setWorkspaceId((current) => current ?? workspaceList[0]?.id ?? null);
      setDiagnostics(diagnosticsReport);
      setSettings(settingsData);
      setCodexStatus(codex);
      await refreshTerminals();
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Could not load Config Pilot state.");
    }
  }, [pushToast, refreshTerminals]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (treeError) {
      pushToast("error", treeError);
    }
  }, [treeError, pushToast]);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }
    api.diffStatus(workspaceId).then(setDiffStatus).catch(() => undefined);
  }, [workspaceId]);

  const openFile = useCallback(
    async (filePath: string) => {
      if (!workspaceId) {
        return;
      }
      try {
        const file = await api.readFile(workspaceId, filePath);
        setSelectedFile(file);
        setEditorText(file.text ?? "");
        setDirty(false);
        if (layout === "mobile") {
          setActiveMobileTab("terminal");
        }
      } catch (error) {
        pushToast("error", error instanceof Error ? error.message : "Could not open file.");
      }
    },
    [workspaceId, pushToast, layout],
  );

  const saveFile = useCallback(
    async (confirmed = false) => {
      if (!workspaceId || !selectedFile) {
        return;
      }
      try {
        await api.writeFile(workspaceId, selectedFile.path, editorText, confirmed);
        setDirty(false);
        pushToast("success", "File saved.");
        await refreshTree();
      } catch (error) {
        pushToast("error", error instanceof Error ? error.message : "Could not save file.");
      }
    },
    [workspaceId, selectedFile, editorText, pushToast, refreshTree],
  );

  const createTerminal = useCallback(
    async (type: "shell" | "codex", initialPrompt?: string) => {
      if (!workspaceId) {
        return;
      }
      try {
        const terminal = await api.createTerminal({
          type,
          workspaceId,
          name: type === "codex" ? "Codex" : "Shell",
          initialPrompt,
          confirmed: true,
        });
        setTerminals((items) => [...items, terminal]);
        setActiveTerminalId(terminal.id);
        if (layout === "mobile") {
          setActiveMobileTab("terminal");
        }
      } catch (error) {
        pushToast("error", error instanceof Error ? error.message : "Could not start terminal.");
      }
    },
    [workspaceId, setTerminals, pushToast, layout],
  );

  return (
    <AppShell
      layout={layout}
      activeMobileTab={activeMobileTab}
      onMobileTabChange={setActiveMobileTab}
      workspaces={workspaces}
      selectedWorkspace={selectedWorkspace}
      onWorkspaceChange={(id) => {
        setWorkspaceId(id);
        setSelectedFile(null);
        setDirty(false);
      }}
      currentPath={currentPath}
      onPathChange={setCurrentPath}
      fileTree={tree}
      onRefreshFiles={refreshTree}
      onOpenFile={openFile}
      selectedFile={selectedFile}
      editorText={editorText}
      dirty={dirty}
      onEditorChange={(value) => {
        setEditorText(value);
        setDirty(true);
      }}
      onSaveFile={saveFile}
      terminals={terminals}
      activeTerminalId={activeTerminalId}
      onActiveTerminalChange={setActiveTerminalId}
      onNewShell={() => void createTerminal("shell")}
      onNewCodex={(prompt) => void createTerminal("codex", prompt)}
      onStopTerminal={async (id) => {
        const stopped = await api.stopTerminal(id);
        setTerminals((items) => items.map((item) => (item.id === id ? stopped : item)));
      }}
      onCloseTerminal={async (id) => {
        await api.deleteTerminal(id);
        setTerminals((items) => items.filter((item) => item.id !== id));
      }}
      diagnostics={diagnostics}
      settings={settings}
      codexStatus={codexStatus}
      diffStatus={diffStatus}
      onRefreshAll={refreshAll}
      toasts={toasts}
      onDismissToast={(id) => setToasts((items) => items.filter((toast) => toast.id !== id))}
    />
  );
}
