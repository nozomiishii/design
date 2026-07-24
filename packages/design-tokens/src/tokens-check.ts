/**
 * 全テーマコンテキスト（light / dark）を検査する。
 *
 * terrazzo lint の a11y/min-contrast はデフォルトコンテキストしか見ないため、
 * ここで全コンテキストに対して WCAG コントラストとトークンの過不足を検査する。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 検査するテキストと背景のペア。トークンを増やしたらここに追加する。
export const CONTRAST_PAIRS = [
  { background: "color.background", foreground: "color.text" },
] as const;

export const WCAG_AA_MIN_CONTRAST = 4.5;

export type CheckError = {
  context: string;
  message: string;
};

export type FlatTokens = Map<string, ColorValue>;

type ColorValue = {
  alpha?: number;
  colorSpace: string;
  components: [number, number, number];
  hex?: string;
};

type ResolverDocument = {
  modifiers: {
    theme: {
      contexts: Record<string, { $ref: string }[]>;
    };
  };
};

/**
 * 全コンテキストで CONTRAST_PAIRS のコントラスト比を検査する。
 */
export function checkContrast(
  contexts: Map<string, FlatTokens>,
  pairs: readonly { background: string; foreground: string }[],
  minContrast: number,
): CheckError[] {
  const errors: CheckError[] = [];

  for (const [context, tokens] of contexts) {
    for (const pair of pairs) {
      const foreground = tokens.get(pair.foreground);
      const background = tokens.get(pair.background);

      if (foreground !== undefined && background !== undefined) {
        const ratio = contrastRatio(foreground.components, background.components);

        if (ratio < minContrast) {
          errors.push({
            context,
            message: `${pair.foreground} と ${pair.background} のコントラスト比 ${ratio.toFixed(2)} が ${String(minContrast)} 未満`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * 全コンテキストのトークンIDが一致するか検査する。
 * 片方のモードにだけトークンを追加した事故を検出する。
 */
export function checkParity(contexts: Map<string, FlatTokens>): CheckError[] {
  const errors: CheckError[] = [];
  const allIds = new Set<string>();

  for (const tokens of contexts.values()) {
    for (const id of tokens.keys()) {
      allIds.add(id);
    }
  }

  for (const [context, tokens] of contexts) {
    for (const id of allIds) {
      if (!tokens.has(id)) {
        errors.push({
          context,
          message: `トークン ${id} がコンテキスト ${context} に存在しない`,
        });
      }
    }
  }

  return errors;
}

/**
 * WCAG 2.1 のコントラスト比。1(同色) 〜 21(白黒)。
 */
export function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * DTCG トークングループを `color.text` 形式のIDに平坦化する。
 */
export function flattenTokens(group: Record<string, unknown>, prefix = ""): FlatTokens {
  const result: FlatTokens = new Map();

  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith("$")) {
      continue;
    }

    if (typeof value !== "object" || value === null) {
      continue;
    }

    const id = prefix === "" ? key : `${prefix}.${key}`;
    const node = value as Record<string, unknown>;

    if ("$value" in node) {
      result.set(id, node.$value as ColorValue);
    } else {
      for (const [childId, childValue] of flattenTokens(node, id)) {
        result.set(childId, childValue);
      }
    }
  }

  return result;
}

/**
 * リゾルバ文書からコンテキストごとの平坦化済みトークンを読み込む。
 */
export function loadContexts(resolverPath: string): Map<string, FlatTokens> {
  const resolver = JSON.parse(readFileSync(resolverPath, "utf8")) as ResolverDocument;
  const baseDir = path.dirname(resolverPath);

  const contexts = new Map<string, FlatTokens>();

  for (const [context, sources] of Object.entries(resolver.modifiers.theme.contexts)) {
    const merged: FlatTokens = new Map();

    for (const source of sources) {
      const tokens = JSON.parse(readFileSync(path.resolve(baseDir, source.$ref), "utf8")) as Record<
        string,
        unknown
      >;

      for (const [id, value] of flattenTokens(tokens)) {
        merged.set(id, value);
      }
    }
    contexts.set(context, merged);
  }

  return contexts;
}

/**
 * WCAG 2.1 の相対輝度。components は 0-1 の sRGB。
 */
export function relativeLuminance(components: [number, number, number]): number {
  const [r, g, b] = components.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const isMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const resolverPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../tokens.resolver.json",
  );
  const contexts = loadContexts(resolverPath);
  const errors = [
    ...checkParity(contexts),
    ...checkContrast(contexts, CONTRAST_PAIRS, WCAG_AA_MIN_CONTRAST),
  ];

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`✗ [${error.context}] ${error.message}`);
    }
    process.exitCode = 1;
  } else {
    console.warn(`✔ 全コンテキスト検査OK (${contexts.keys().toArray().join(", ")})`);
  }
}
