import { defineConfig, node } from "@nozomiishii/eslint-config";

export default defineConfig([
  ...node(),

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.ts", "oxfmt.config.ts", "commitlint.config.ts"],
        },
      },
    },
    name: "design/allowDefaultProject",
  },
]);
