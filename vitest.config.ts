import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/kl/{device,editor,bench,provider}.ts"],
      reporter: ["text", "json", "json-summary"],
      thresholds: { statements: 95, branches: 95 },
    },
  },
});
