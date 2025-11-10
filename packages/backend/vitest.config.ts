import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "backend",
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "convex/_generated/",
        "**/*.d.ts",
        "**/*.config.*",
      ],
    },
    include: ["convex/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
    exclude: ["node_modules", "convex/_generated"],
  },
});
