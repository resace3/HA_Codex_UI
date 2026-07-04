import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/App.tsx",
        "src/api/types.ts",
        "src/hooks/useApi.ts",
        "src/hooks/useIngressBase.ts",
        "src/hooks/useWebSocket.ts"
      ],
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 70
      }
    }
  }
});
