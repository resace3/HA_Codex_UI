import { render, screen } from "@testing-library/react";
import FileBrowser from "../src/components/FileBrowser";

it("renders a file tree", () => {
  render(
    <FileBrowser
      currentPath="."
      onPathChange={() => undefined}
      onRefresh={() => undefined}
      onOpenFile={() => undefined}
      selectedWorkspace={{ id: "share-workspace", name: "Workspace", root: "/share/config_pilot_workspace", readable: true, writable: true, sensitive: false }}
      fileTree={[{ name: "automations.yaml", path: "automations.yaml", type: "file", size: 20, modifiedAt: "2026-01-01T00:00:00.000Z", writable: true, sensitive: false }]}
    />,
  );
  expect(screen.getByText("automations.yaml")).toBeInTheDocument();
  expect(screen.getByRole("tree")).toBeInTheDocument();
});
