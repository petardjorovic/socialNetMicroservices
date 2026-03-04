// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // globals: true,
    setupFiles: ["./tests/setup.ts"],
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["src/app.ts", "src/utils/logger.ts", "src/utils/redis.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 70,
        statements: 90,
      },
    },
  },
});
