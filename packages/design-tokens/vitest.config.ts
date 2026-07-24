import { defineConfig } from "vitest/config";
import { env } from "./env";

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html"],
    },

    watch: !env.CI,
  },
});
