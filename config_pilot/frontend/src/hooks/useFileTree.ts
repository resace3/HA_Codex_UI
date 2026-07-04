import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { FileTreeEntry } from "../api/types";

export function useFileTree(workspaceId: string | null, currentPath: string) {
  const [tree, setTree] = useState<FileTreeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!workspaceId) {
      return;
    }
    try {
      setTree(await api.tree(workspaceId, currentPath));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load files.");
    }
  }, [workspaceId, currentPath]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { tree, error, refresh };
}
