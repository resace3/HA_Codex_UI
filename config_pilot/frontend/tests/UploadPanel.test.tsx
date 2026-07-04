import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadPanel from "../src/components/UploadPanel";

it("validates upload file size", async () => {
  const user = userEvent.setup();
  render(<UploadPanel currentPath="." selectedWorkspace={{ id: "share-workspace", name: "Workspace", root: "/share/config_pilot_workspace", readable: true, writable: true, sensitive: false }} />);
  const file = new File(["x".repeat(51 * 1024 * 1024)], "large.txt", { type: "text/plain" });
  await user.upload(screen.getByLabelText(/Select file/), file);
  expect(screen.getByText(/exceeds 50 MiB/)).toBeInTheDocument();
});
