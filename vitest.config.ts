import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pipeline/unit tests live under test/; Astro pages are covered by the
    // build smoke test, not vitest.
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
