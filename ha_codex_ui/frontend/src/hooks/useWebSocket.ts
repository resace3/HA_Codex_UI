import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string | null, onMessage: (message: MessageEvent<string>) => void) {
  const [status, setStatus] = useState<"closed" | "connecting" | "open">("closed");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url) {
      return;
    }
    const socket = new WebSocket(url);
    socketRef.current = socket;
    setStatus("connecting");
    socket.addEventListener("open", () => setStatus("open"));
    socket.addEventListener("close", () => setStatus("closed"));
    socket.addEventListener("message", onMessage);
    return () => {
      socket.removeEventListener("message", onMessage);
      socket.close();
      socketRef.current = null;
    };
  }, [url, onMessage]);

  return { status, socket: socketRef.current };
}
