import { useCallback, useState } from "react";

export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  return { loading, error, run };
}
