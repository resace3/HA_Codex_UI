import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CodexLauncher from "../src/components/CodexLauncher";
import ConfirmDangerDialog from "../src/components/ConfirmDangerDialog";
import FileTree from "../src/components/FileTree";
import Toasts from "../src/components/Toasts";
import WorkspacePicker from "../src/components/WorkspacePicker";
import type { FileTreeEntry, Workspace } from "../src/api/types";
import { formatBytes, shortDate } from "../src/utils/format";
import { apiPath, detectIngressBase, joinPath, websocketPath } from "../src/utils/paths";
import { requiresDangerConfirmation, validateUploadSize } from "../src/utils/validation";

describe("utility and small component coverage", () => {
  it("formats values and paths", () => {
    expect(formatBytes(42)).toBe("42 B");
    expect(formatBytes(2048)).toBe("2.0 KiB");
    expect(shortDate("2026-01-01T00:00:00.000Z")).toContain("26");
    expect(detectIngressBase("/api/hassio_ingress/token/dashboard")).toBe("/api/hassio_ingress/token");
    expect(apiPath("api/health", "/prefix")).toBe("/prefix/api/health");
    expect(websocketPath("/api/terminals/1/ws", "/prefix", { protocol: "https:", host: "ha.local" })).toBe(
      "wss://ha.local/prefix/api/terminals/1/ws",
    );
    expect(joinPath("/share/", "/folder/file.txt")).toBe("/share/folder/file.txt");
  });

  it("validates risky paths and upload sizes", () => {
    expect(validateUploadSize(new File(["x"], "small.txt"), 1)).toBeNull();
    expect(validateUploadSize(new File(["xx"], "large.txt"), 0)).toBe("File exceeds 0 MiB.");
    expect(requiresDangerConfirmation("/config/configuration.yaml")).toBe(true);
    expect(requiresDangerConfirmation("/share/notes.txt")).toBe(false);
  });

  it("renders and handles small action components", async () => {
    const user = userEvent.setup();
    const cancel = vi.fn();
    const confirm = vi.fn();
    const dismiss = vi.fn();
    const { rerender } = render(
      <ConfirmDangerDialog
        open={false}
        title="Confirm write"
        message="Dangerous change"
        onCancel={cancel}
        onConfirm={confirm}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(
      <ConfirmDangerDialog
        open
        title="Confirm write"
        message="Dangerous change"
        onCancel={cancel}
        onConfirm={confirm}
      />,
    );
    await user.click(screen.getByText("Cancel"));
    await user.click(screen.getByText("Confirm"));
    expect(cancel).toHaveBeenCalled();
    expect(confirm).toHaveBeenCalled();

    render(<Toasts toasts={[{ id: 1, kind: "success", message: "Saved" }]} onDismiss={dismiss} />);
    await user.click(screen.getByText("Saved"));
    expect(dismiss).toHaveBeenCalledWith(1);
  });

  it("renders picker and tree variants", async () => {
    const user = userEvent.setup();
    const workspaceChange = vi.fn();
    const openFile = vi.fn();
    const openFolder = vi.fn();
    const workspaces: Workspace[] = [
      {
        id: "share",
        name: "Workspace",
        root: "/share/ha_codex_ui_workspace",
        readable: true,
        writable: true,
        sensitive: false,
        reason: "Default writable workspace",
      },
      {
        id: "config",
        name: "Config",
        root: "/config",
        readable: true,
        writable: false,
        sensitive: true,
      },
    ];
    const entries: FileTreeEntry[] = [
      {
        name: "folder",
        path: "folder",
        type: "directory",
        size: 0,
        modifiedAt: "2026-01-01T00:00:00.000Z",
        writable: true,
        sensitive: false,
      },
      {
        name: "config.yaml",
        path: "config.yaml",
        type: "file",
        size: 12,
        modifiedAt: "2026-01-01T00:00:00.000Z",
        writable: true,
        sensitive: false,
      },
      {
        name: "secrets.yaml",
        path: "secrets.yaml",
        type: "file",
        size: 64,
        modifiedAt: "2026-01-01T00:00:00.000Z",
        writable: false,
        sensitive: true,
      },
    ];
    const { rerender } = render(
      <>
        <WorkspacePicker
          workspaces={workspaces}
          selectedWorkspace={workspaces[0]}
          onWorkspaceChange={workspaceChange}
        />
        <FileTree entries={entries} onOpenFile={openFile} onOpenFolder={openFolder} />
      </>,
    );
    await user.selectOptions(screen.getByLabelText(/Workspace/), "config");
    await user.click(screen.getByText("folder"));
    await user.click(screen.getByText("config.yaml"));
    expect(workspaceChange).toHaveBeenCalledWith("config");
    expect(openFolder).toHaveBeenCalledWith("folder");
    expect(openFile).toHaveBeenCalledWith("config.yaml");
    expect(screen.getByText("secrets.yaml").closest("button")).toBeDisabled();

    rerender(<FileTree entries={[]} onOpenFile={openFile} onOpenFolder={openFolder} />);
    expect(screen.getByText("No files.")).toBeInTheDocument();
  });

  it("requires confirmation before starting Codex", async () => {
    const user = userEvent.setup();
    const start = vi.fn();
    render(<CodexLauncher onStart={start} />);
    const button = screen.getByRole("button", { name: /Codex/ });
    expect(button).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Starting prompt"), "Review YAML");
    await user.click(screen.getByLabelText(/Codex can edit/));
    await user.click(button);
    expect(start).toHaveBeenCalledWith("Review YAML");
  });
});
