import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Tests live beside the code they test: name.test.ts next to name.ts.
    include: ["{apps,packages,tools}/*/src/**/*.test.ts", "data/fixtures/src/**/*.test.ts"],
  },
});
