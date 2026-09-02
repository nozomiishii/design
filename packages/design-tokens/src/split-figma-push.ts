/**
 * TokensBrücke が push する単一ファイルをモード別ファイルに分割する。
 *
 * TokensBrücke の GitHub PR push は単一 JSON で、複数モードの値は
 * Cobalt 由来の $extensions.mode パターンに入る。ハブ（tokens/）は
 * 純DTCG のモード別ファイルなので、この境界で正規化する。
 *
 * 使い方: tsx src/split-figma-push.ts [入力ファイル]
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN_MODES = ["light", "dark"];

type TokenGroup = Record<string, unknown>;

interface TokenNode {
  $extensions?: { mode?: Record<string, unknown> };
  $value?: unknown;
}

/**
 * $extensions.mode を持つトークン群を、モードごとの純DTCGグループに分割する。
 * モード値がないトークンは $value をそのまま使う（Cobalt の既定値の意味論）。
 */
export function splitByMode(
  group: TokenGroup,
  modes: readonly string[],
): Record<string, TokenGroup> {
  const result: Record<string, TokenGroup> = {};

  for (const mode of modes) {
    result[mode] = splitGroupForMode(group, mode);
  }

  return result;
}

function splitGroupForMode(group: TokenGroup, mode: string): TokenGroup {
  const result: TokenGroup = {};

  for (const [key, value] of Object.entries(group)) {
    if (typeof value !== "object" || value === null) {
      continue;
    }

    const node = value as TokenGroup & TokenNode;

    if ("$value" in node) {
      const { $extensions, $value, ...rest } = node;
      result[key] = { ...rest, $value: $extensions?.mode?.[mode] ?? $value };
    } else if (!key.startsWith("$")) {
      result[key] = splitGroupForMode(node, mode);
    }
  }

  return result;
}

const isMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const inputPath = path.resolve(
    process.argv[2] ?? path.join(packageDir, "figma-export.tokens.json"),
  );

  const group = JSON.parse(readFileSync(inputPath, "utf-8")) as TokenGroup;
  const byMode = splitByMode(group, KNOWN_MODES);

  for (const [mode, tokens] of Object.entries(byMode)) {
    const destination = path.join(packageDir, "tokens", `${mode}.tokens.json`);
    writeFileSync(destination, `${JSON.stringify(tokens, undefined, 2)}\n`);
    console.warn(`✔ ${destination}`);
  }
  console.warn("次: pnpm lint && pnpm build で検査と生成を実行");
}
