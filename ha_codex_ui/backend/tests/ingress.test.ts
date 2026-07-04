import { ingressBasePath, stripIngressPrefix } from "../src/server/ingress.js";

describe("ingress helpers", () => {
  it("detects Home Assistant ingress path headers", () => {
    expect(ingressBasePath({ "x-ha-ingress-path": "/api/hassio_ingress/abc/" })).toBe("/api/hassio_ingress/abc");
  });

  it("strips ingress prefix for WebSocket routing", () => {
    expect(stripIngressPrefix("/api/hassio_ingress/abc/api/terminals/1/ws", { "x-ha-ingress-path": "/api/hassio_ingress/abc" })).toBe("/api/terminals/1/ws");
  });
});
