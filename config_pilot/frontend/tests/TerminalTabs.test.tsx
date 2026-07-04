import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TerminalTabs from "../src/components/TerminalTabs";

it("renders and closes terminal tabs", async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(
    <TerminalTabs
      terminals={[{ id: "1", name: "Shell", type: "shell", workspaceId: "share-workspace", cwd: "/share/config_pilot_workspace", createdAt: "2026-01-01T00:00:00.000Z", lastActiveAt: "2026-01-01T00:00:00.000Z", status: "running", cols: 120, rows: 30 }]}
      activeTerminalId="1"
      onActiveTerminalChange={() => undefined}
      onNewShell={() => undefined}
      onNewCodex={() => undefined}
      onStopTerminal={() => undefined}
      onCloseTerminal={close}
    />,
  );
  expect(screen.getByText("Shell")).toBeInTheDocument();
  await user.click(screen.getByTitle("Close terminal"));
  expect(close).toHaveBeenCalledWith("1");
});

it("requires confirmation before starting Codex", () => {
  render(
    <TerminalTabs
      terminals={[]}
      activeTerminalId={null}
      onActiveTerminalChange={() => undefined}
      onNewShell={() => undefined}
      onNewCodex={() => undefined}
      onStopTerminal={() => undefined}
      onCloseTerminal={() => undefined}
    />,
  );
  expect(screen.getByTitle("Start Codex")).toBeDisabled();
});
