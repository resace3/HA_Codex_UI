import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDangerDialog from "../src/components/ConfirmDangerDialog";
import Toasts from "../src/components/Toasts";
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
});
