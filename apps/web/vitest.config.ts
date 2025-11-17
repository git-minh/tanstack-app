import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "web",
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    // Disable all pooling - run everything in main thread
    pool: "vmThreads",
    // Run test files sequentially (not in parallel)
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/routeTree.gen.ts",
        "**/.output/**",
      ],
    },
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "node_modules",
      ".output",
      "dist",
      // Temporarily skip due to memory issues in CI
      "src/features/tasks/tasks.test.tsx",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tanstack/backend": path.resolve(__dirname, "../../packages/backend"),
    },
  },
});
