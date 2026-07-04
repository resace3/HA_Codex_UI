export function detectIngressBase(pathname = window.location.pathname): string {
  const match = pathname.match(/^(\/api\/hassio_ingress\/[^/]+)/);
  return match?.[1] ?? "";
}

export function apiPath(path: string, base = detectIngressBase()): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function websocketPath(path: string, base = detectIngressBase(), locationLike: Pick<Location, "protocol" | "host"> = window.location): string {
  const protocol = locationLike.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${locationLike.host}${apiPath(path, base)}`;
}

export function joinPath(left: string, right: string): string {
  const lhs = left.replace(/\/+$/, "");
  const rhs = right.replace(/^\/+/, "");
  return lhs ? `${lhs}/${rhs}` : rhs;
}
