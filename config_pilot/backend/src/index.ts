import { startServer } from "./server/httpServer.js";

startServer().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown startup failure";
  console.error(`Config Pilot startup failed: ${message}`);
  process.exit(1);
});
