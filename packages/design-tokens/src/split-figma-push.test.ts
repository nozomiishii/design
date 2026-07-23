import { describe, expect, test } from "vitest";
import { splitByMode } from "./split-figma-push";

const srgb = (components: [number, number, number]) => ({
  alpha: 1,
  colorSpace: "srgb",
  components,
});

describe("splitByMode", () => {
  // $extensions.mode の値をモード別ファイルの $value に展開する
  test("expands mode values into per-mode groups", () => {
    const result = splitByMode(
      {
        color: {
          background: {
            $extensions: { mode: { dark: srgb([0, 0, 0]), light: srgb([1, 1, 1]) } },
            $type: "color",
            $value: srgb([1, 1, 1]),
          },
        },
      },
      ["light", "dark"],
    );

    expect(result.light).toStrictEqual({
      color: { background: { $type: "color", $value: srgb([1, 1, 1]) } },
    });
    expect(result.dark).toStrictEqual({
      color: { background: { $type: "color", $value: srgb([0, 0, 0]) } },
    });
  });

  // モード値を持たないトークンは $value を全モードに使う（Cobaltの既定値の意味論）
  test("falls back to base value when a token has no mode values", () => {
    const result = splitByMode(
      {
        color: {
          accent: { $type: "color", $value: srgb([0.7, 0.4, 0.4]) },
        },
      },
      ["light", "dark"],
    );

    expect(result.light?.color).toStrictEqual({
      accent: { $type: "color", $value: srgb([0.7, 0.4, 0.4]) },
    });
    expect(result.dark?.color).toStrictEqual({
      accent: { $type: "color", $value: srgb([0.7, 0.4, 0.4]) },
    });
  });

  // $description は保持し、$extensions は出力に含めない
  test("keeps descriptions and drops extensions", () => {
    const result = splitByMode(
      {
        color: {
          text: {
            $description: "本文テキストの色",
            $extensions: { mode: { dark: srgb([1, 1, 1]), light: srgb([0, 0, 0]) } },
            $type: "color",
            $value: srgb([0, 0, 0]),
          },
        },
      },
      ["light", "dark"],
    );

    const token = result.light?.color as Record<string, unknown>;

    expect(token.text).toStrictEqual({
      $description: "本文テキストの色",
      $type: "color",
      $value: srgb([0, 0, 0]),
    });
  });
});
