export function ingressBasePath(headers: Record<string, string | string[] | undefined>): string {
  const direct = singleHeader(headers["x-ingress-path"]) || singleHeader(headers["x-ha-ingress-path"]);
  if (!direct) {
    return "";
  }
  return direct.replace(/\/+$/, "");
}

export function stripIngressPrefix(url: string, headers: Record<string, string | string[] | undefined>): string {
  const prefix = ingressBasePath(headers);
  if (prefix && url.startsWith(prefix)) {
    return url.slice(prefix.length) || "/";
  }
  return url;
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
