import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import tailwind from "@terrazzo/plugin-tailwind";
import { REQUIRED_TOKENS, requiredChildrenMatches } from "./src/tokens-check";

const templatePath = new URL("tailwind.template.css", import.meta.url).pathname;

export default defineConfig({
  lint: {
    rules: {
      "core/descriptions": "warn",
      "core/duplicate-values": "warn",
      // TokensBrücke の Omit collection names や DTCG キーの設定ミスでトークンIDがずれると、
      // 中身が空でも他の検査は素通りする。期待するIDの存在をここで固定する。
      "core/required-children": ["error", { matches: requiredChildrenMatches(REQUIRED_TOKENS) }],
      "core/required-type": "error",
      // legacyFormat を許すと Color mode の設定ミス(hex文字列)が通ってしまう。
      "core/valid-color": ["error", { legacyFormat: false }],
      // コントラスト検査とモード差分検査は terrazzo lint だとデフォルトコンテキスト(light)しか
      // 見ないため、全コンテキストを検査する src/tokens-check.ts で行う。
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
