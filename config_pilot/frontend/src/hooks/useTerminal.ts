import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { TerminalModel } from "../api/types";

export function useTerminals() {
  const [terminals, setTerminals] = useState<TerminalModel[]>([]);
  const refresh = useCallback(async () => {
    setTerminals(await api.terminals());
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { terminals, setTerminals, refresh };
}
