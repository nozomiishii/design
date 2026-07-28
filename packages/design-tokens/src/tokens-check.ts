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

// 期待するトークンID。terrazzo.config.ts の core/required-children もここから組み立てる。
// Figma Variables を増やしたらここに追加する。
export const REQUIRED_TOKENS = ["color.background", "color.text"] as const;

export type CheckError = {
  context: string;
  message: string;
};

export type FlatTokens = Map<string, ColorValue>;

export type RequiredChildrenMatch = {
  match: string[];
  requiredTokens: string[];
};

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
 * 全コンテキストの値が同一でないか検査する。
 * Figma のモードが1つしかない、またはモード名が light / dark とずれていると、
 * 分割時に既定値へフォールバックして全コンテキストが同値になる。
 */
export function checkModeDivergence(contexts: Map<string, FlatTokens>): CheckError[] {
  if (contexts.size < 2) {
    return [];
  }

  const [reference, ...others] = contexts.values().toArray();

  if (reference === undefined) {
    return [];
  }

  for (const tokens of others) {
    for (const [id, value] of reference) {
      if (JSON.stringify(tokens.get(id)) !== JSON.stringify(value)) {
        return [];
      }
    }
  }

  return [
    {
      context: contexts.keys().toArray().join(", "),
      message: "全コンテキストの値が同一。Figma のモード名が light / dark とずれている可能性",
    },
  ];
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
 * 期待するトークンが全コンテキストに存在するか検査する。
 * トークンIDがずれる設定ミスを、値の検査より先に捕まえる。
 */
export function checkRequired(
  contexts: Map<string, FlatTokens>,
  ids: readonly string[],
): CheckError[] {
  const errors: CheckError[] = [];

  for (const [context, tokens] of contexts) {
    for (const id of ids) {
      if (!tokens.has(id)) {
        errors.push({
          context,
          message: `期待するトークン ${id} がコンテキスト ${context} に存在しない`,
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

/**
 * 期待するトークンIDを terrazzo の core/required-children が取る matches 形式に変換する。
 */
export function requiredChildrenMatches(ids: readonly string[]): RequiredChildrenMatch[] {
  const byGroup = new Map<string, string[]>();

  for (const id of ids) {
    const separator = id.lastIndexOf(".");

    if (separator === -1) {
      throw new Error(`トークンID ${id} がグループを持たない。グループ付きのIDにする`);
    }

    const group = id.slice(0, separator);
    const children = byGroup.get(group) ?? [];
    children.push(id.slice(separator + 1));
    byGroup.set(group, children);
  }

  return byGroup
    .entries()
    .map(([group, requiredTokens]) => ({ match: [`${group}.*`], requiredTokens }))
    .toArray();
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
    ...checkRequired(contexts, REQUIRED_TOKENS),
    ...checkParity(contexts),
    ...checkModeDivergence(contexts),
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
