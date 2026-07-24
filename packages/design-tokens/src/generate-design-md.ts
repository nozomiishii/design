/**
 * DESIGN.md の値セクションをトークンから再生成する。
 *
 * 値はトークンが真実の源。DESIGN.md のマーカー間だけを書き換え、
 * 手書きのルールセクションには触れない。
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContexts } from "./tokens-check";

const START_MARKER = "<!-- generated:tokens:start -->";
const END_MARKER = "<!-- generated:tokens:end -->";

/**
 * コンテキスト別のトークン値を Markdown テーブルにする。
 */
export function renderTokensSection(contexts: ReturnType<typeof loadContexts>): string {
  const contextNames = contexts.keys().toArray();
  const allIds = new Set<string>();

  for (const tokens of contexts.values()) {
    for (const id of tokens.keys()) {
      allIds.add(id);
    }
  }

  const lines = [
    `| トークン | ${contextNames.join(" | ")} |`,
    `| --- | ${contextNames.map(() => "---").join(" | ")} |`,
  ];

  const sortedIds = allIds
    .values()
    .toArray()
    .toSorted((a, b) => a.localeCompare(b));

  for (const id of sortedIds) {
    const values = contextNames.map((context) => {
      const value = contexts.get(context)?.get(id);

      return value?.hex ?? "-";
    });
    lines.push(`| \`${id}\` | ${values.join(" | ")} |`);
  }

  return lines.join("\n");
}

/**
 * マーカー間を差し替えた本文を返す。
 */
export function replaceGeneratedSection(document: string, section: string): string {
  const start = document.indexOf(START_MARKER);
  const end = document.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`DESIGN.md に ${START_MARKER} と ${END_MARKER} のマーカーが必要`);
  }

  return `${document.slice(0, start + START_MARKER.length)}\n\n${section}\n\n${document.slice(end)}`;
}

const isMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const designMdPath = path.resolve(packageDir, "DESIGN.md");
  const contexts = loadContexts(path.resolve(packageDir, "tokens.resolver.json"));

  const document = readFileSync(designMdPath, "utf8");
  const updated = replaceGeneratedSection(document, renderTokensSection(contexts));
  writeFileSync(designMdPath, updated);
  console.warn("✔ DESIGN.md の値セクションを再生成");
}
