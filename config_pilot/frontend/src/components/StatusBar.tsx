import type { Workspace } from "../api/types";

type Props = {
  selectedWorkspace: Workspace | null;
  dirty: boolean;
  terminalCount: number;
};

export default function StatusBar({ selectedWorkspace, dirty, terminalCount }: Props) {
  return (
    <footer className="statusbar">
      <span>{selectedWorkspace?.root ?? "No workspace"}</span>
      <span>{dirty ? "Unsaved changes" : "Saved"}</span>
      <span>{terminalCount} terminal{terminalCount === 1 ? "" : "s"}</span>
    </footer>
  );
}
