import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { WebSocketServer } from "ws";
import type { FastifyInstance } from "fastify";
import type { TerminalService } from "../services/terminalService.js";
import { stripIngressPrefix } from "./ingress.js";

export function attachWebSocketServer(app: FastifyInstance, terminalService: TerminalService): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  app.server.on("upgrade", (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const normalizedUrl = stripIngressPrefix(request.url ?? "", request.headers);
    const match = normalizedUrl.match(/\/api\/terminals\/([^/]+)\/ws(?:\?.*)?$/);
    const terminalId = match?.[1];
    if (!terminalId) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      terminalService.attachWebSocket(decodeURIComponent(terminalId), ws);
    });
  });
  return wss;
}
