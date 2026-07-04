import { render, screen } from "@testing-library/react";
import DiffViewer from "../src/components/DiffViewer";

it("renders added and removed lines", () => {
  render(<DiffViewer diffStatus={{ source: "git", files: [{ path: "configuration.yaml", status: "M" }] }} diffText={"+light: on\n-light: off"} />);
  expect(screen.getByText("+light: on")).toHaveClass("added");
  expect(screen.getByText("-light: off")).toHaveClass("removed");
});
