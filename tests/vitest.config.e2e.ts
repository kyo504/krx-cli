import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/e2e/**/*.test.ts"],
    testTimeout: 240_000,
    retry: 0,
    sequence: { concurrent: false },
  },
});
