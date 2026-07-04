import { useState } from "react";
import { Bot } from "lucide-react";

type Props = {
  onStart: (prompt?: string) => void;
};

export default function CodexLauncher({ onStart }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [prompt, setPrompt] = useState("");
  return (
    <div className="codex-launcher">
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Starting prompt" rows={2} />
      <label>
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        Codex can edit files and run commands.
      </label>
      <button type="button" disabled={!confirmed} onClick={() => onStart(prompt)} title="Start Codex">
        <Bot size={16} /> Codex
      </button>
    </div>
  );
}
