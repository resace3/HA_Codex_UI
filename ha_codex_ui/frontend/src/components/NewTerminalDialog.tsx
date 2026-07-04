import { TerminalSquare } from "lucide-react";

type Props = {
  onStart: () => void;
};

export default function NewTerminalDialog({ onStart }: Props) {
  return (
    <button type="button" className="primary-action" onClick={onStart} title="New shell">
      <TerminalSquare size={16} /> Shell
    </button>
  );
}
