/**
 * Figma 公式エクスポート（コレクションのフォルダ）を tokens/ に取り込む。
 *
 * Figma はモードごとに1ファイルを出力し、ルートの
 * $extensions["com.figma.modeName"] にモード名を持つ。
 * モード名をそのままファイル名（light.tokens.json 等）にする。
 *
 * 使い方: pnpm import:figma <エクスポートフォルダ>
 */
import { copyFileSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN_MODES = ["light", "dark"];

export interface ImportPlan {
  destination: string;
  source: string;
}

/**
 * エクスポートフォルダを読み、コピー計画を返す。
 * モード名が light / dark 以外ならエラー。Figma 側でモード名を直す。
 */
export function planImport(exportDir: string, tokensDir: string): ImportPlan[] {
  const files = readdirSync(exportDir).filter((file) => file.endsWith(".tokens.json"));

  if (files.length === 0) {
    throw new Error(`${exportDir} に *.tokens.json が見つからない`);
  }

  return files.map((file) => {
    const source = path.join(exportDir, file);
    const document = JSON.parse(readFileSync(source, "utf-8")) as {
      $extensions?: Record<string, unknown>;
    };
    const modeName = document.$extensions?.["com.figma.modeName"];

    if (typeof modeName !== "string") {
      throw new TypeError(`${file} に com.figma.modeName がない`);
    }

    const mode = modeName.toLowerCase();

    if (!KNOWN_MODES.includes(mode)) {
      throw new Error(
        `モード名 ${modeName} は未対応。Figma のモード名を ${KNOWN_MODES.join(" / ")} にする`,
      );
    }

    return { destination: path.join(tokensDir, `${mode}.tokens.json`), source };
  });
}

const isMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const exportDir = process.argv[2];

  if (exportDir === undefined) {
    console.error("使い方: pnpm import:figma <エクスポートフォルダ>");
    process.exitCode = 1;
  } else {
    const tokensDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../tokens");
    const plans = planImport(path.resolve(exportDir), tokensDir);

    for (const plan of plans) {
      copyFileSync(plan.source, plan.destination);
      console.warn(`✔ ${plan.source} → ${plan.destination}`);
    }
    console.warn("次: pnpm lint && pnpm build で検査と生成を実行");
  }
}
