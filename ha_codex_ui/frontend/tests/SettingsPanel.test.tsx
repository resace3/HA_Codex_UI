import { render, screen } from "@testing-library/react";
import SettingsPanel from "../src/components/SettingsPanel";

it("shows safe defaults and remote execution messaging", () => {
  render(
    <SettingsPanel
      selectedWorkspace={{ id: "config", name: "Home Assistant config", root: "/config", readable: true, writable: false, sensitive: true }}
      settings={{ max_upload_mb: 50, max_terminal_sessions: 8, allow_config_write: false }}
    />,
  );
  expect(screen.getByText("Denied")).toBeInTheDocument();
  expect(screen.getByText("GitHub Actions only.")).toBeInTheDocument();
});
