import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { TerminalModel } from "../api/types";
import { createTerminalSocket } from "../api/websocket";

type Props = {
  terminal: TerminalModel;
};

export default function TerminalView({ terminal }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }
    const fit = new FitAddon();
    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      theme: { background: "#0a0f14", foreground: "#d7e2ea", cursor: "#7dd3fc" },
    });
    term.loadAddon(fit);
    term.open(hostRef.current);
    fit.fit();
    const socket = createTerminalSocket(terminal.id);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data as string) as { type: string; data?: string; message?: string };
      if (message.type === "output" && message.data) {
        term.write(message.data);
      }
      if (message.type === "error" && message.message) {
        term.writeln(message.message);
      }
    });
    term.onData((data) => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ type: "input", data })));
    const resizeObserver = new ResizeObserver(() => {
      fit.fit();
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    });
    resizeObserver.observe(hostRef.current);
    return () => {
      resizeObserver.disconnect();
      socket.close();
      term.dispose();
    };
  }, [terminal.id]);

  return <div className="terminal-view" ref={hostRef} aria-label={`Terminal ${terminal.name}`} />;
}
