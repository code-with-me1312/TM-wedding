import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/firestore.rules.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
