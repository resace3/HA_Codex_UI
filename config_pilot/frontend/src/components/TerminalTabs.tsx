import { Bot, Plus, Square, X } from "lucide-react";
import type { TerminalModel } from "../api/types";
import CodexLauncher from "./CodexLauncher";
import NewTerminalDialog from "./NewTerminalDialog";
import TerminalView from "./TerminalView";

type Props = {
  terminals: TerminalModel[];
  activeTerminalId: string | null;
  onActiveTerminalChange: (id: string) => void;
  onNewShell: () => void;
  onNewCodex: (prompt?: string) => void;
  onStopTerminal: (id: string) => void;
  onCloseTerminal: (id: string) => void;
};

export default function TerminalTabs({ terminals, activeTerminalId, onActiveTerminalChange, onNewShell, onNewCodex, onStopTerminal, onCloseTerminal }: Props) {
  const active = terminals.find((terminal) => terminal.id === activeTerminalId) ?? terminals[0] ?? null;
  return (
    <section className="terminal-panel">
      <div className="terminal-tabs">
        {terminals.map((terminal) => (
          <button type="button" key={terminal.id} aria-pressed={active?.id === terminal.id} onClick={() => onActiveTerminalChange(terminal.id)}>
            {terminal.type === "codex" ? <Bot size={15} /> : <Plus size={15} />}
            <span>{terminal.name}</span>
            <small>{terminal.status}</small>
          </button>
        ))}
        <NewTerminalDialog onStart={onNewShell} />
        <CodexLauncher onStart={onNewCodex} />
      </div>
      <div className="terminal-controls">
        <button type="button" disabled={!active} onClick={() => active && onStopTerminal(active.id)} title="Stop terminal">
          <Square size={16} /> Stop
        </button>
        <button type="button" disabled={!active} onClick={() => active && onCloseTerminal(active.id)} title="Close terminal">
          <X size={16} /> Close
        </button>
      </div>
      {active ? <TerminalView terminal={active} /> : <div className="terminal-empty">No terminal running.</div>}
    </section>
  );
}
