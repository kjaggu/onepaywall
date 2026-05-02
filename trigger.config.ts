import { defineConfig } from "@trigger.dev/sdk/v3"
import { readFileSync } from "fs"
import { resolve } from "path"

// Parse a .env file into key-value pairs (handles quoted values, ignores comments)
function parseEnvFile(path: string): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf-8")
        .split("\n")
        .filter(line => line.trim() && !line.trim().startsWith("#") && line.includes("="))
        .map(line => {
          const eq = line.indexOf("=")
          const key = line.slice(0, eq).trim()
          const raw = line.slice(eq + 1).trim()
          const value = raw.replace(/^(['"])(.*)\1$/, "$2") // strip surrounding quotes
          return [key, value] as [string, string]
        })
    )
  } catch {
    return {}
  }
}

export default defineConfig({
  project: "proj_itztobxqfhruppvwwzkh",
  logLevel: "log",
  // Maximum seconds a single task run is allowed to execute
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
  dirs: ["./trigger"],
  // Reads .env.local and syncs all variables to Trigger.dev's encrypted store.
  // Variables are injected into the task container at runtime — this is how
  // DATABASE_URL and other secrets reach the running task.
  resolveEnvVars: async () => {
    const vars = parseEnvFile(resolve(process.cwd(), ".env.local"))
    return { variables: vars }
  },
})
