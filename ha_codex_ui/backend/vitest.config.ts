import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/server/httpServer.ts",
        "src/server/websocket.ts",
        "src/server/routes/**",
        "src/server/middleware/**",
        "src/types/**"
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
      },
      watermarks: {
        lines: [80, 95],
        branches: [70, 95],
        functions: [80, 95],
        statements: [80, 95]
      }
    }
  }
});
