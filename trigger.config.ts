import { defineConfig } from "@trigger.dev/sdk/v3"

// IMPORTANT: Replace the project value below with your Trigger.dev project ref.
// Find it at: cloud.trigger.dev → your project → Settings → "Project ref" field.
// It looks like:  proj_xxxxxxxxxxxxxxxxxx
// Then run:  npx trigger.dev@latest dev   (to test locally)
//            npx trigger.dev@latest deploy (to push to production)

export default defineConfig({
  project: "proj_REPLACE_WITH_YOUR_PROJECT_REF",
  logLevel: "log",
  // Maximum seconds a single task run is allowed to execute (hard cap on Trigger.dev infra)
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
})
