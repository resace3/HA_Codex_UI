import { websocketPath } from "../utils/paths";

export function terminalWebSocketUrl(terminalId: string): string {
  return websocketPath(`/api/terminals/${encodeURIComponent(terminalId)}/ws`);
}

export function createTerminalSocket(terminalId: string): WebSocket {
  return new WebSocket(terminalWebSocketUrl(terminalId));
}
