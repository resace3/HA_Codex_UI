import { useMemo } from "react";
import { detectIngressBase } from "../utils/paths";

export function useIngressBase(): string {
  return useMemo(() => detectIngressBase(), []);
}
