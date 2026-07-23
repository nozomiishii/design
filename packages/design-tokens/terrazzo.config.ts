import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import tailwind from "@terrazzo/plugin-tailwind";

const templatePath = new URL("tailwind.template.css", import.meta.url).pathname;

export default defineConfig({
  lint: {
    rules: {
      "core/descriptions": "warn",
      "core/duplicate-values": "warn",
      "core/required-type": "error",
      // コントラスト検査は terrazzo lint だとデフォルトコンテキスト(light)しか見ないため、
      // 全コンテキストを検査する src/tokens-check.ts で行う。
    },
  },
  // ルート .gitignore が dist を無視するため、コミットする生成物は generated に出す
  outDir: "./generated",
  plugins: [
    css({
      filename: "tokens.css",
      permutations: [
        {
          input: { theme: "light" },
          prepare: (contents) => `:root {\n${contents}\n}`,
        },
        {
          input: { theme: "dark" },
          prepare: (contents) => `[data-theme='dark'] {\n${contents}\n}`,
        },
      ],
    }),
    tailwind({
      filename: "tailwind-theme.css",
      template: templatePath,
      theme: {
        color: ["color.**"],
      },
    }),
  ],
  tokens: ["./tokens.resolver.json"],
});
