import pino from "pino";
import { redactSecrets } from "../security/secretRedaction.js";

export function createLogger(level = "info") {
  return pino({
    level,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "headers.authorization",
        "headers.cookie",
        "*.token",
        "*.access_token",
        "*.refresh_token",
        "*.SUPERVISOR_TOKEN",
      ],
      censor: "[redacted]",
    },
    formatters: {
      log(object) {
        return redactLogObject(object);
      },
    },
  });
}

function redactLogObject(value: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") {
      output[key] = redactSecrets(item);
    } else {
      output[key] = item;
    }
  }
  return output;
}
