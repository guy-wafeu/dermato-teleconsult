import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setupEnv.ts", "./test/mocks.ts"],
    testTimeout: 15000,
  },
});
