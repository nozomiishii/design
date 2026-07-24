import { describe, expect, test } from "vitest";
import {
  checkContrast,
  checkParity,
  contrastRatio,
  flattenTokens,
  type FlatTokens,
} from "./tokens-check";

const color = (components: [number, number, number]) => ({
  alpha: 1,
  colorSpace: "srgb",
  components,
});

describe("flattenTokens", () => {
  // ネストしたグループを color.text 形式のIDに漏れなく平坦化する。出力の順序は仕様ではない
  test("flattens nested groups into dot-separated ids", () => {
    const tokens = flattenTokens({
      color: {
        surface: {
          card: { $type: "color", $value: color([1, 1, 1]) },
        },
        text: { $type: "color", $value: color([0, 0, 0]) },
      },
    });

    expect(new Set(tokens.keys())).toStrictEqual(new Set(["color.surface.card", "color.text"]));
  });

  // $type や $extensions などの $ プレフィックスキーはトークンとして扱わない
  test("ignores $-prefixed metadata keys", () => {
    const tokens = flattenTokens({
      $extensions: { "com.figma.modeName": "light" },
      color: {
        text: { $type: "color", $value: color([0, 0, 0]) },
      },
    });

    expect(tokens.keys().toArray()).toStrictEqual(["color.text"]);
  });
});

describe("contrastRatio", () => {
  // 白と黒は WCAG 2.1 の最大コントラスト比 21 になる
  test("returns 21 for white on black", () => {
    expect(contrastRatio([1, 1, 1], [0, 0, 0])).toBeCloseTo(21, 5);
  });

  // 同色はコントラスト比 1 になる
  test("returns 1 for identical colors", () => {
    expect(contrastRatio([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])).toBe(1);
  });

  // 引数の順序を入れ替えても結果は同じになる
  test("is symmetric regardless of argument order", () => {
    const a: [number, number, number] = [0.9, 0.2, 0.4];
    const b: [number, number, number] = [0.1, 0.8, 0.3];

    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a));
  });
});

describe("checkParity", () => {
  // 片方のコンテキストにだけ存在するトークンをエラーにする
  test("reports token missing from one context", () => {
    const contexts = new Map<string, FlatTokens>([
      ["dark", new Map([["color.text", color([1, 1, 1])]])],
      [
        "light",
        new Map([
          ["color.accent", color([0.7, 0.4, 0.4])],
          ["color.text", color([0, 0, 0])],
        ]),
      ],
    ]);

    const errors = checkParity(contexts);

    expect(errors).toStrictEqual([
      { context: "dark", message: "トークン color.accent がコンテキスト dark に存在しない" },
    ]);
  });

  // 全コンテキストのトークンが一致していればエラーなし
  test("passes when all contexts define the same tokens", () => {
    const contexts = new Map<string, FlatTokens>([
      ["dark", new Map([["color.text", color([1, 1, 1])]])],
      ["light", new Map([["color.text", color([0, 0, 0])]])],
    ]);

    expect(checkParity(contexts)).toStrictEqual([]);
  });
});

describe("checkContrast", () => {
  const pairs = [{ background: "color.background", foreground: "color.text" }];

  // AA基準 4.5 を下回るコンテキストをエラーにする
  test("reports context whose pair falls below the minimum", () => {
    const contexts = new Map<string, FlatTokens>([
      [
        "dark",
        new Map([
          [
            "color.background",
            color([0.06666666666666667, 0.06666666666666667, 0.06666666666666667]),
          ],
          // 背景とほぼ同色のテキスト。darkだけ壊れているケース
          ["color.text", color([0.13, 0.13, 0.13])],
        ]),
      ],
      [
        "light",
        new Map([
          ["color.background", color([1, 1, 1])],
          ["color.text", color([0.06666666666666667, 0.06666666666666667, 0.06666666666666667])],
        ]),
      ],
    ]);

    const errors = checkContrast(contexts, pairs, 4.5);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.context).toBe("dark");
  });

  // 全コンテキストが基準を満たしていればエラーなし
  test("passes when every context meets the minimum", () => {
    const contexts = new Map<string, FlatTokens>([
      [
        "dark",
        new Map([
          ["color.background", color([0, 0, 0])],
          ["color.text", color([1, 1, 1])],
        ]),
      ],
      [
        "light",
        new Map([
          ["color.background", color([1, 1, 1])],
          ["color.text", color([0, 0, 0])],
        ]),
      ],
    ]);

    expect(checkContrast(contexts, pairs, 4.5)).toStrictEqual([]);
  });
});
